import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Loader2, ArrowLeft, Archive } from 'lucide-react';
import type { ReportForm, Construction, Customer, ReportFile, Profile } from '../types';
import { ExportDialog } from '../components/ExportDialog';
import type { ExportMetaData } from '../components/ExportDialog';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { supabase } from '../lib/supabase';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { InputDialog } from '../components/InputDialog';
import { ReportsTable, ReportsActionBar, ReportsFilterBar } from '../features/reports/components';
import { useReportsFiltering } from '../features/reports/hooks';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmDialogContext';
import { useHandleError } from '../hooks/useHandleError';
import { errorHandler } from '../lib/errorHandler';

// Dynamic imports for PDF/Word export to reduce initial bundle size
const generatePDF = async (report: ReportForm, userProfile?: Profile) => {
    const { generatePDF: gen } = await import('../lib/pdfGenerator');
    return gen(report, userProfile);
};

const generateBulkPDF = async (reports: ReportForm[], filename: string, userProfile?: Profile) => {
    const { generateBulkPDF: gen } = await import('../lib/pdfGenerator');
    return gen(reports, filename, userProfile);
};

const generateWordDocument = async (reports: ReportForm[], metaData: ExportMetaData, userId?: string) => {
    const { generateWordDocument: gen } = await import('../services/wordExportService');
    return gen(reports, metaData, userId);
};

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const { addItem: addRecentItem } = useRecentlyViewed();
    const { success: showSuccess } = useToast();
    const handleError = useHandleError();
    const confirm = useConfirm();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isNewReportOpen, setIsNewReportOpen] = useState(false);
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<ReportFile[]>([]);

    // Section name dialog state
    const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
    const [sectionDialogConfig, setSectionDialogConfig] = useState<{
        mode: 'create' | 'edit';
        typeId?: 1 | 2;
        existingId?: string;
        initialValue?: string;
    }>({ mode: 'create' });

    // Filtering
    const {
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        dateFilter, setDateFilter,
        filteredAirReports,
        filteredWaterReports,
    } = useReportsFiltering(reports);

    // Check accreditations (1 = Water, 2 = Air)
    const hasWaterAccreditation = profile?.accreditations?.includes(1) ?? false;
    const hasAirAccreditation = profile?.accreditations?.includes(2) ?? false;
    const hasAnyAccreditation = hasWaterAccreditation || hasAirAccreditation;

    useEffect(() => {
        if (customerId && constructionId) {
            loadData();
            loadFiles();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, constructionId]);

    // Track construction in recently viewed
    useEffect(() => {
        if (construction && customerId && constructionId) {
            addRecentItem({
                id: constructionId,
                type: 'construction',
                name: construction.name,
                subtext: construction.work_order || undefined,
                path: `/customers/${customerId}/constructions/${constructionId}/reports`
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [construction?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [constructionData, customerData, reportsData] = await Promise.all([
                constructionService.getById(constructionId!),
                customerService.getById(customerId!),
                reportService.getByConstruction(constructionId!)
            ]);
            setConstruction(constructionData);
            setCustomer(customerData);
            setReports(reportsData);
        } catch (error) {
            errorHandler.handle(error, 'ConstructionReports');
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async () => {
        try {
            const { data, error } = await supabase
                .from('report_files')
                .select('*')
                .eq('construction_id', constructionId!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUploadedFiles(data || []);
        } catch (error) {
            errorHandler.handle(error, 'ConstructionReports');
        }
    };

    const handleFileUploaded = (file: ReportFile) => {
        setUploadedFiles([file, ...uploadedFiles]);
    };

    const handleFileDeleted = (fileId: string) => {
        setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    };

    // Report operations
    const handleDelete = async (id: string) => {
        if (!(await confirm({ title: 'Are you sure you want to delete this report?', variant: 'destructive' }))) return;
        try {
            await reportService.delete(id);
            setReports(reports.filter(r => r.id !== id));
            if (selectedIds.has(id)) {
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        } catch (error) {
            handleError(error, 'ConstructionReports');
        }
    };

    const handleDuplicate = (report: ReportForm) => {
        const basePath = `/customers/${customerId}/constructions/${constructionId}/reports/new`;
        const path = report.type_id === 1
            ? `${basePath}/water?duplicate=${report.id}`
            : `${basePath}/air?duplicate=${report.id}`;
        navigate(path);
    };

    const handleExportPDF = (report: ReportForm) => {
        setActionMessage({ text: 'Generating PDF...', type: 'info' });
        try {
            generatePDF(report, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            const appError = errorHandler.handle(error, 'ConstructionReports');
            setActionMessage({ text: errorHandler.getUserMessage(appError), type: 'error' });
        }
    };

    const handleBulkExport = () => {
        if (reports.length === 0) return;
        const reportsToExport = selectedIds.size > 0
            ? reports.filter(r => r.id && selectedIds.has(r.id) && !r.section_name)
            : reports.filter(r => !r.section_name);
        setActionMessage({ text: 'Generating PDF export...', type: 'info' });
        try {
            generateBulkPDF(reportsToExport, `Reports_${construction?.work_order || 'bundle'}.pdf`, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            const appError = errorHandler.handle(error, 'ConstructionReports');
            setActionMessage({ text: errorHandler.getUserMessage(appError), type: 'error' });
        }
    };

    const handleExportConfirm = async (metaData: ExportMetaData, dialogSelectedReports?: ReportForm[]) => {
        setIsExporting(true);
        setActionMessage({ text: 'Generating Word document...', type: 'info' });
        try {
            let reportsToExport: ReportForm[] = [];
            if (dialogSelectedReports && dialogSelectedReports.length > 0) {
                reportsToExport = dialogSelectedReports;
            } else if (selectedIds.size > 0) {
                reportsToExport = reports.filter(r => r.id && selectedIds.has(r.id));
            } else {
                reportsToExport = reports.filter(r => !r.section_name);
            }
            await generateWordDocument(reportsToExport, metaData, user?.id);
            setActionMessage(null);
        } catch (error) {
            const appError = errorHandler.handle(error, 'ConstructionReports');
            setActionMessage({ text: errorHandler.getUserMessage(appError), type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        const count = selectedIds.size;
        if (!(await confirm({ title: `Are you sure you want to delete ${count} selected report${count > 1 ? 's' : ''}?`, description: `This action cannot be undone. Delete ${count} report${count > 1 ? 's' : ''} permanently?`, variant: 'destructive' }))) return;
        try {
            await Promise.all(Array.from(selectedIds).map(id => reportService.delete(id)));
            setReports(reports.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set());
            showSuccess(`Successfully deleted ${count} report${count > 1 ? 's' : ''}`);
        } catch (err: unknown) {
            handleError(err, 'ConstructionReports');
        }
    };

    // Section management
    const handleAddSection = (typeId: 1 | 2) => {
        setSectionDialogConfig({ mode: 'create', typeId });
        setSectionDialogOpen(true);
    };

    const handleCreateSection = async (name: string) => {
        const typeId = sectionDialogConfig.typeId;
        if (!typeId) return;
        try {
            const maxOrdinal = reports.length > 0 ? Math.max(...reports.map(r => r.ordinal)) : 0;
            const sectionPayload = {
                construction_id: constructionId,
                section_name: name,
                ordinal: maxOrdinal + 1,
                material_type_id: typeId,
            };
            const newSection = await reportService.create(sectionPayload);
            setReports([...reports, newSection]);
        } catch (error) {
            handleError(error, 'ConstructionReports');
        }
    };

    const handleUpdateSectionName = (id: string, currentName: string) => {
        setSectionDialogConfig({ mode: 'edit', existingId: id, initialValue: currentName });
        setSectionDialogOpen(true);
    };

    const handleEditSection = async (newName: string) => {
        const { existingId, initialValue } = sectionDialogConfig;
        if (!existingId || newName === initialValue) return;
        try {
            await reportService.update(existingId, { section_name: newName });
            setReports(reports.map(r => r.id === existingId ? { ...r, section_name: newName } : r));
        } catch (error) {
            handleError(error, 'ConstructionReports');
        }
    };

    const handleSectionDialogConfirm = (value: string) => {
        if (sectionDialogConfig.mode === 'create') {
            handleCreateSection(value);
        } else {
            handleEditSection(value);
        }
    };

    // Drag and drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = reports.findIndex((r) => r.id === active.id);
        const newIndex = reports.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newReports = arrayMove(reports, oldIndex, newIndex);
        setReports(newReports);
        try {
            await reportService.updateOrder(newReports);
        } catch (error) {
            handleError(error, 'ConstructionReports');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer || !construction) {
        return <div>{t('reports.noData')}</div>;
    }

    const isArchived = construction.is_archived;

    return (
        <div className="space-y-6">
            {actionMessage && (
                <div className={`px-4 py-3 rounded-md border ${actionMessage.type === 'error' ? 'border-destructive text-destructive bg-destructive/10' : 'border-border text-foreground bg-muted/50'}`}>
                    {actionMessage.text}
                </div>
            )}

            {/* Archived Warning Banner */}
            {isArchived && (
                <div className="px-4 py-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 flex items-center gap-3">
                    <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">{t('constructions.archivedBadge')}</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">{t('constructions.archiveConfirmMessage')}</p>
                    </div>
                </div>
            )}

            <Breadcrumbs items={[
                { label: customer.name, path: `/customers` },
                { label: construction.name, path: `/customers/${customerId}/constructions` },
                { label: t('reports.title') }
            ]} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/customers/${customerId}/constructions`)}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Go back to constructions"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('reports.title')}</h1>
                        <p className="text-sm text-muted-foreground line-clamp-1 md:line-clamp-none">
                            {t('constructions.for')} {construction.name} ({construction.work_order}) - {customer.name}
                        </p>
                    </div>
                </div>
                <ReportsActionBar
                    customerId={customerId!}
                    constructionId={constructionId!}
                    selectedCount={selectedIds.size}
                    hasWaterAccreditation={hasWaterAccreditation}
                    hasAirAccreditation={hasAirAccreditation}
                    hasAnyAccreditation={hasAnyAccreditation}
                    isArchived={isArchived}
                    isNewReportOpen={isNewReportOpen}
                    isAddSectionOpen={isAddSectionOpen}
                    onToggleNewReport={() => setIsNewReportOpen(!isNewReportOpen)}
                    onToggleAddSection={() => setIsAddSectionOpen(!isAddSectionOpen)}
                    onDeleteSelected={handleDeleteSelected}
                    onAddSection={handleAddSection}
                    onExportDialog={() => setExportDialogOpen(true)}
                    onBulkExport={handleBulkExport}
                    t={t}
                />
            </div>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                onConfirm={handleExportConfirm}
                loading={isExporting}
                defaultValues={{
                    constructionPart: construction.name
                }}
                reports={selectedIds.size === 0 ? reports : undefined}
                constructionId={constructionId!}
                uploadedFiles={uploadedFiles}
                onFileUploaded={handleFileUploaded}
                onFileDeleted={handleFileDeleted}
            />

            <ReportsFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                t={t}
            />

            {/* Air Reports Table */}
            {hasAirAccreditation && filteredAirReports.length > 0 && (
                <ReportsTable
                    title={`${t('reports.air')} Reports`}
                    reports={reports}
                    filteredReports={filteredAirReports}
                    selectedIds={selectedIds}
                    customerId={customerId!}
                    constructionId={constructionId!}
                    onToggleSelect={toggleSelect}
                    onSetSelectedIds={setSelectedIds}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onExportPDF={handleExportPDF}
                    onUpdateSectionName={handleUpdateSectionName}
                    onDragEnd={handleDragEnd}
                    t={t}
                />
            )}

            {/* Water Reports Table */}
            {hasWaterAccreditation && filteredWaterReports.length > 0 && (
                <ReportsTable
                    title={`${t('reports.water')} Reports`}
                    reports={reports}
                    filteredReports={filteredWaterReports}
                    selectedIds={selectedIds}
                    customerId={customerId!}
                    constructionId={constructionId!}
                    onToggleSelect={toggleSelect}
                    onSetSelectedIds={setSelectedIds}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onExportPDF={handleExportPDF}
                    onUpdateSectionName={handleUpdateSectionName}
                    onDragEnd={handleDragEnd}
                    t={t}
                />
            )}

            {/* Section Name Input Dialog */}
            <InputDialog
                isOpen={sectionDialogOpen}
                onClose={() => setSectionDialogOpen(false)}
                onConfirm={handleSectionDialogConfirm}
                title={t('reports.enterSectionName')}
                placeholder={t('reports.enterSectionName')}
                initialValue={sectionDialogConfig.initialValue || ''}
            />
        </div>
    );
};
