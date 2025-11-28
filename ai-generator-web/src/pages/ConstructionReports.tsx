import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Loader2, Plus, FileText, Trash2, ArrowLeft, FileDown, Pencil, Type, GripVertical, Archive } from 'lucide-react';
import type { ReportForm, Construction, Customer, ReportFile, Profile } from '../types';
import clsx from 'clsx';
import { ExportDialog } from '../components/ExportDialog';

// Dynamic imports for PDF/Word export to reduce initial bundle size
const generatePDF = async (report: ReportForm, userProfile?: Profile) => {
    const { generatePDF: gen } = await import('../lib/pdfGenerator');
    return gen(report, userProfile);
};

const generateBulkPDF = async (reports: ReportForm[], filename: string, userProfile?: Profile) => {
    const { generateBulkPDF: gen } = await import('../lib/pdfGenerator');
    return gen(reports, filename, userProfile);
};

const generateWordDocument = async (reports: ReportForm[], metaData: any, userId?: string) => {
    const { generateWordDocument: gen } = await import('../services/wordExportService');
    return gen(reports, metaData, userId);
};
import type { ExportMetaData } from '../components/ExportDialog';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InputDialog } from '../components/InputDialog';

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    // Removed draggedId state - now handled by @dnd-kit
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

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'satisfies' | 'failed'>('all');
    const [dateFilter, setDateFilter] = useState('');

    // Check accreditations (1 = Water, 2 = Air)
    const hasWaterAccreditation = profile?.accreditations?.includes(1) ?? false;
    const hasAirAccreditation = profile?.accreditations?.includes(2) ?? false;
    const hasAnyAccreditation = hasWaterAccreditation || hasAirAccreditation;

    useEffect(() => {
        if (customerId && constructionId) {
            loadData();
            loadFiles();
        }
    }, [customerId, constructionId]);

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
            console.error('Error loading data:', error);
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
            console.error('Error loading files:', error);
        }
    };

    const handleFileUploaded = (file: ReportFile) => {
        setUploadedFiles([file, ...uploadedFiles]);
    };

    const handleFileDeleted = (fileId: string) => {
        setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await reportService.delete(id);
            setReports(reports.filter(r => r.id !== id));
            // Remove from selection if present
            if (selectedIds.has(id)) {
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    const handleExportPDF = (report: ReportForm) => {
        setActionMessage({ text: 'Generating PDF...', type: 'info' });
        try {
            generatePDF(report, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            setActionMessage({ text: 'Failed to export PDF. Please try again.', type: 'error' });
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
            console.error('Failed to export PDFs:', error);
            setActionMessage({ text: 'Failed to export PDFs. Please try again.', type: 'error' });
        }
    };

    const handleExportConfirm = async (metaData: ExportMetaData, dialogSelectedReports?: ReportForm[]) => {
        setIsExporting(true);
        setActionMessage({ text: 'Generating Word document...', type: 'info' });
        try {
            let reportsToExport: ReportForm[] = [];

            if (dialogSelectedReports && dialogSelectedReports.length > 0) {
                // Include both reports and sections
                reportsToExport = dialogSelectedReports;
            } else if (selectedIds.size > 0) {
                // Include both reports and sections
                reportsToExport = reports.filter(r => r.id && selectedIds.has(r.id));
            } else {
                // Fallback: if no selection in dialog (shouldn't happen due to validation) and no pre-selection
                reportsToExport = reports.filter(r => !r.section_name);
            }

            await generateWordDocument(reportsToExport, metaData, user?.id);
            setActionMessage(null);
        } catch (error) {
            console.error(error);
            setActionMessage({ text: 'Failed to generate report. Please try again.', type: 'error' });
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

    // @dnd-kit sensors for mouse and touch
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = reports.findIndex((r) => r.id === active.id);
        const newIndex = reports.findIndex((r) => r.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newReports = arrayMove(reports, oldIndex, newIndex);

        // Optimistic update
        setReports(newReports);

        try {
            await reportService.updateOrder(newReports);
        } catch (error) {
            console.error('Failed to update order', error);
            alert('Failed to save new order');
        }
    };

    // Sortable row component - applies drag functionality directly to <tr>
    const SortableRow = ({ report, children }: { report: ReportForm; children: (props: { attributes: any; listeners: any }) => React.ReactNode }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: report.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const isSection = report.section_name && !report.draft_id;

        return (
            <tr
                ref={setNodeRef}
                style={style}
                className={clsx(
                    isSection ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/50',
                    'transition-colors'
                )}
            >
                {children({ attributes, listeners })}
            </tr>
        );
    };

    const handleDeleteSelected = async () => {
        const count = selectedIds.size;

        // First confirmation
        if (!window.confirm(`Are you sure you want to delete ${count} selected report${count > 1 ? 's' : ''}?`)) {
            return;
        }

        // Second confirmation
        if (!window.confirm(`This action cannot be undone. Delete ${count} report${count > 1 ? 's' : ''} permanently?`)) {
            return;
        }

        try {
            // Delete all selected reports
            await Promise.all(
                Array.from(selectedIds).map(id => reportService.delete(id))
            );

            // Update the UI
            setReports(reports.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set());

            alert(`Successfully deleted ${count} report${count > 1 ? 's' : ''}`);
        } catch (err: unknown) {
            alert('Failed to delete reports: ' + (err as Error).message);
        }
    };

    const handleAddSection = (typeId: 1 | 2) => {
        setSectionDialogConfig({ mode: 'create', typeId });
        setSectionDialogOpen(true);
    };

    const handleCreateSection = async (name: string) => {
        const typeId = sectionDialogConfig.typeId;
        if (!typeId) return;

        try {
            const maxOrdinal = reports.length > 0 ? Math.max(...reports.map(r => r.ordinal)) : 0;

            // Create section - just a placeholder entry with section_name set
            // NOTE: type_id should NOT be set for sections - they are identified by having section_name and no type_id
            // We use material_type_id to indicate which type of section this is: 1 = Water, 2 = Air
            const sectionPayload = {
                construction_id: constructionId,
                section_name: name,
                ordinal: maxOrdinal + 1,
                material_type_id: typeId, // 1 = Water section, 2 = Air section
                // Do NOT set type_id for sections
            };
            const newSection = await reportService.create(sectionPayload);
            setReports([...reports, newSection]);
        } catch (error) {
            console.error('Failed to create section:', error);
            alert('Failed to create section');
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
            console.error('Failed to update section name:', error);
            alert('Failed to update section name');
        }
    };

    const handleSectionDialogConfirm = (value: string) => {
        if (sectionDialogConfig.mode === 'create') {
            handleCreateSection(value);
        } else {
            handleEditSection(value);
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

    // Split reports by type
    // Include sections based on their material_type_id (1 = Water, 2 = Air)
    const airReports = reports.filter(report => report.type_id === 2 || (!report.type_id && report.section_name && report.material_type_id === 2));
    const waterReports = reports.filter(report => report.type_id === 1 || (!report.type_id && report.section_name && report.material_type_id === 1));

    // Apply filters and search for Air reports
    const filteredAirReports = airReports.filter(report => {
        // Sections should always be visible
        const isSection = report.section_name && !report.draft_id;
        if (isSection) return true;

        // Search by dionica/stock
        if (searchTerm && !report.dionica?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !report.stock?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'satisfies' && !report.satisfies) return false;
            if (statusFilter === 'failed' && report.satisfies) return false;
        }

        // Filter by date
        if (dateFilter) {
            const reportDate = new Date(report.examination_date).toISOString().split('T')[0];
            if (reportDate !== dateFilter) return false;
        }

        return true;
    });

    // Apply filters and search for Water reports
    const filteredWaterReports = waterReports.filter(report => {
        // Sections should always be visible
        const isSection = report.section_name && !report.draft_id;
        if (isSection) return true;

        // Search by dionica/stock
        if (searchTerm && !report.dionica?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !report.stock?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'satisfies' && !report.satisfies) return false;
            if (statusFilter === 'failed' && report.satisfies) return false;
        }

        // Filter by date
        if (dateFilter) {
            const reportDate = new Date(report.examination_date).toISOString().split('T')[0];
            if (reportDate !== dateFilter) return false;
        }

        return true;
    });

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
                <div className="flex flex-wrap gap-2 md:space-x-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center px-3 py-2 md:px-4 border border-destructive/40 rounded-md shadow-sm text-sm font-medium text-destructive bg-transparent hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
                        >
                            <Trash2 className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">{t('reports.deleteSelected')} ({selectedIds.size})</span>
                        </button>
                    )}
                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setIsNewReportOpen(!isNewReportOpen)}
                            disabled={!hasAnyAccreditation || isArchived}
                            title={isArchived ? t('constructions.archived') : (!hasAnyAccreditation ? "You don't have any accreditations" : "")}
                            className="inline-flex items-center px-3 py-2 md:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">{t('reports.newReport')}</span>
                            <span className="md:hidden">{t('reports.new')}</span>
                        </button>
                        {isNewReportOpen && (
                            <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-48 rounded-md shadow-lg bg-card border border-border shadow-border/40 focus:outline-none z-50">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    {hasWaterAccreditation && (
                                        <Link
                                            to={`/customers/${customerId}/constructions/${constructionId}/reports/new/water`}
                                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            role="menuitem"
                                            onClick={() => setIsNewReportOpen(false)}
                                        >
                                            {t('reports.waterMethod')}
                                        </Link>
                                    )}
                                    {hasAirAccreditation && (
                                        <Link
                                            to={`/customers/${customerId}/constructions/${constructionId}/reports/new/air`}
                                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            role="menuitem"
                                            onClick={() => setIsNewReportOpen(false)}
                                        >
                                            {t('reports.airMethod')}
                                        </Link>
                                    )}
                                    {!hasAnyAccreditation && (
                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                            No accreditations available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {isNewReportOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsNewReportOpen(false)}
                        />
                    )}
                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setIsAddSectionOpen(!isAddSectionOpen)}
                            disabled={!hasAnyAccreditation || isArchived}
                            title={isArchived ? t('constructions.archived') : (!hasAnyAccreditation ? "You don't have any accreditations" : "")}
                            className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Type className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">{t('reports.addSection')}</span>
                        </button>
                        {isAddSectionOpen && (
                            <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-48 rounded-md shadow-lg bg-card border border-border shadow-border/40 focus:outline-none z-50">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    {hasWaterAccreditation && (
                                        <button
                                            onClick={() => {
                                                handleAddSection(1);
                                                setIsAddSectionOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            role="menuitem"
                                        >
                                            {t('reports.water')} Section
                                        </button>
                                    )}
                                    {hasAirAccreditation && (
                                        <button
                                            onClick={() => {
                                                handleAddSection(2);
                                                setIsAddSectionOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            role="menuitem"
                                        >
                                            {t('reports.air')} Section
                                        </button>
                                    )}
                                    {!hasAnyAccreditation && (
                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                            No accreditations available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {isAddSectionOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsAddSectionOpen(false)}
                        />
                    )}
                    <button
                        onClick={() => setExportDialogOpen(true)}
                        className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                    >
                        <FileText className="h-5 w-5 md:mr-2 text-muted-foreground" />
                        <span className="hidden md:inline">{t('reports.generateReports')}</span>
                        <span className="md:hidden">{t('reports.generate')}</span>
                    </button>
                    <button
                        onClick={handleBulkExport}
                        className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                    >
                        <FileDown className="h-5 w-5 md:mr-2 text-muted-foreground" />
                        <span className="hidden md:inline">{selectedIds.size > 0 ? `${t('reports.exportSelected')} (${selectedIds.size})` : t('reports.exportAll')}</span>
                        <span className="md:hidden">{t('reports.export')}</span>
                    </button>
                </div>
            </div>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                onConfirm={handleExportConfirm}
                loading={isExporting}
                defaultValues={{
                    constructionPart: construction.name,
                    certifierName: profile?.name ? `${profile.name} ${profile.last_name}` : ''
                }}
                reports={selectedIds.size === 0 ? reports : undefined}
                constructionId={constructionId!}
                uploadedFiles={uploadedFiles}
                onFileUploaded={handleFileUploaded}
                onFileDeleted={handleFileDeleted}
            />

            {/* Filters */}
            <div className="bg-card shadow rounded-lg overflow-hidden border border-border p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Search */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('reports.dionica')}
                        </label>
                        <input
                            type="text"
                            id="search"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                            placeholder={t('reports.searchDionica')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('reports.status')}
                        </label>
                        <select
                            id="status"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="satisfies">{t('reports.satisfies')}</option>
                            <option value="failed">{t('reports.failed')}</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('reports.date')}
                        </label>
                        <input
                            type="date"
                            id="date"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Air Reports Table */}
            {hasAirAccreditation && filteredAirReports.length > 0 && (
                <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-semibold text-foreground">{t('reports.air')} Reports</h2>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-border">
                        {filteredAirReports.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-foreground">{t('reports.noData')}</p>
                                </div>
                            </div>
                        ) : (
                            filteredAirReports.map((report) => {
                                const isSection = report.section_name && !report.draft_id;

                                if (isSection) {
                                    return (
                                        <div
                                            key={report.id}
                                            className="p-4 bg-muted/30 border-l-4 border-primary flex justify-between items-center"
                                        >
                                            <div className="font-bold text-foreground">{report.section_name}</div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => report.section_name && handleUpdateSectionName(report.id, report.section_name)}
                                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => report.id && handleDelete(report.id)}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={report.id}
                                        className={clsx(
                                            "p-4 space-y-3 transition-colors",
                                            report.id && selectedIds.has(report.id) ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-input text-primary focus:ring-ring h-5 w-5"
                                                        checked={report.id ? selectedIds.has(report.id) : false}
                                                        onChange={() => report.id && toggleSelect(report.id)}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        {report.type_id === 1 ? 'Water' : 'Air'} - {report.draft?.name || '-'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(report.examination_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={clsx(
                                                "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full",
                                                report.satisfies
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                            </span>
                                        </div>

                                        <div className="pl-8 space-y-1">
                                            <div className="text-sm text-foreground font-medium">
                                                {t('reports.dionica')}: {report.dionica || report.stock || '-'}
                                            </div>
                                        </div>

                                        <div className="pl-8 flex justify-end space-x-2 pt-2">
                                            <button
                                                onClick={() => handleExportPDF(report)}
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                                title={t('reports.exportPdf')}
                                            >
                                                <FileDown className="h-4 w-4" />
                                            </button>
                                            <Link
                                                to={report.type_id === 1
                                                    ? `/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`
                                                    : `/customers/${customerId}/constructions/${constructionId}/reports/air/${report.id}`
                                                }
                                                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                title={t('reports.edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => report.id && handleDelete(report.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                title={t('reports.delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e)}>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="w-10 px-6 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-ring"
                                                checked={filteredAirReports.length > 0 && filteredAirReports.every(r => r.id && selectedIds.has(r.id))}
                                                onChange={() => {
                                                    const allSelected = filteredAirReports.every(r => r.id && selectedIds.has(r.id));
                                                    const newSelected = new Set(selectedIds);
                                                    filteredAirReports.forEach(r => {
                                                        if (r.id) {
                                                            if (allSelected) newSelected.delete(r.id);
                                                            else newSelected.add(r.id);
                                                        }
                                                    });
                                                    setSelectedIds(newSelected);
                                                }}
                                            />
                                        </th>
                                        <th className="w-10 px-6 py-3"></th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.dionica')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.draft')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.status')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    <SortableContext items={filteredAirReports.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                        {filteredAirReports.map((report) => {
                                            const isSection = report.section_name && !report.draft_id;

                                            if (isSection) {
                                                return (
                                                    <SortableRow key={report.id} report={report}>
                                                        {({ attributes, listeners }) => (
                                                            <>
                                                                <td className="w-10 px-6 py-4" {...attributes} {...listeners}>
                                                                    <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                                                </td>
                                                                <td colSpan={5} className="px-6 py-4">
                                                                    <div className="flex items-center justify-center font-bold text-foreground">
                                                                        <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                        {report.section_name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                    <button
                                                                        onClick={() => report.section_name && handleUpdateSectionName(report.id, report.section_name)}
                                                                        className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => report.id && handleDelete(report.id)}
                                                                        className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </SortableRow>
                                                );
                                            }

                                            return (
                                                <SortableRow key={report.id} report={report}>
                                                    {({ attributes, listeners }) => (
                                                        <>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-input text-primary focus:ring-ring"
                                                                    checked={report.id ? selectedIds.has(report.id) : false}
                                                                    onChange={() => report.id && toggleSelect(report.id)}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                                                                <GripVertical className="h-5 w-5" />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                                {new Date(report.examination_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                                                {report.dionica || report.stock || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                                {report.draft?.name || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={clsx(
                                                                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                                    report.satisfies
                                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                                                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                                                )}>
                                                                    {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                <button
                                                                    onClick={() => handleExportPDF(report)}
                                                                    className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                                                    title={t('reports.exportPdf')}
                                                                >
                                                                    <FileDown className="h-4 w-4" />
                                                                </button>
                                                                <Link
                                                                    to={report.type_id === 1
                                                                        ? `/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`
                                                                        : `/customers/${customerId}/constructions/${constructionId}/reports/air/${report.id}`
                                                                    }
                                                                    className="text-primary hover:text-primary/80 inline-flex items-center"
                                                                    title={t('reports.edit')}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => report.id && handleDelete(report.id)}
                                                                    className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                                                    title={t('reports.delete')}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </SortableRow>
                                            );
                                        })}
                                    </SortableContext>
                                    {filteredAirReports.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                                {t('reports.noData')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </DndContext>
                </div>
            )}

            {/* Water Reports Table */}
            {hasWaterAccreditation && filteredWaterReports.length > 0 && (
                <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-semibold text-foreground">{t('reports.water')} Reports</h2>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-border">
                        {filteredWaterReports.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-foreground">{t('reports.noData')}</p>
                                </div>
                            </div>
                        ) : (
                            filteredWaterReports.map((report) => {
                                const isSection = report.section_name && !report.draft_id;

                                if (isSection) {
                                    return (
                                        <div
                                            key={report.id}
                                            className="p-4 bg-muted/30 border-l-4 border-primary flex justify-between items-center"
                                        >
                                            <div className="font-bold text-foreground">{report.section_name}</div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => report.section_name && handleUpdateSectionName(report.id, report.section_name)}
                                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => report.id && handleDelete(report.id)}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={report.id}
                                        className={clsx(
                                            "p-4 space-y-3 transition-colors",
                                            report.id && selectedIds.has(report.id) ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-input text-primary focus:ring-ring h-5 w-5"
                                                        checked={report.id ? selectedIds.has(report.id) : false}
                                                        onChange={() => report.id && toggleSelect(report.id)}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        {report.draft?.name || '-'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(report.examination_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={clsx(
                                                "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full",
                                                report.satisfies
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                            </span>
                                        </div>

                                        <div className="pl-8 space-y-1">
                                            <div className="text-sm text-foreground font-medium">
                                                {t('reports.dionica')}: {report.dionica || report.stock || '-'}
                                            </div>
                                        </div>

                                        <div className="pl-8 flex justify-end space-x-2 pt-2">
                                            <button
                                                onClick={() => handleExportPDF(report)}
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                                title={t('reports.exportPdf')}
                                            >
                                                <FileDown className="h-4 w-4" />
                                            </button>
                                            <Link
                                                to={`/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                title={t('reports.edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => report.id && handleDelete(report.id)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                title={t('reports.delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e)}>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="w-10 px-6 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-ring"
                                                checked={
                                                    filteredWaterReports.length > 0 &&
                                                    filteredWaterReports
                                                        .filter(r => !r.section_name)
                                                        .every(r => r.id && selectedIds.has(r.id))
                                                }
                                                onChange={() => {
                                                    const allSelected = filteredWaterReports
                                                        .filter(r => !r.section_name)
                                                        .every(r => r.id && selectedIds.has(r.id));

                                                    const newSelected = new Set(selectedIds);
                                                    filteredWaterReports.forEach(r => {
                                                        if (r.section_name) return; // Skip sections
                                                        if (r.id) {
                                                            if (allSelected) newSelected.delete(r.id);
                                                            else newSelected.add(r.id);
                                                        }
                                                    });
                                                    setSelectedIds(newSelected);
                                                }}
                                            />
                                        </th>
                                        <th className="w-10 px-6 py-3"></th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.dionica')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.draft')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.status')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    <SortableContext items={filteredWaterReports.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                        {filteredWaterReports.map((report) => {
                                            const isSection = report.section_name && !report.draft_id;

                                            if (isSection) {
                                                return (
                                                    <SortableRow key={report.id} report={report}>
                                                        {({ attributes, listeners }) => (
                                                            <>
                                                                <td className="w-10 px-6 py-4" {...attributes} {...listeners}>
                                                                    <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                                                </td>
                                                                <td colSpan={5} className="px-6 py-4">
                                                                    <div className="flex items-center justify-center font-bold text-foreground">
                                                                        <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                        {report.section_name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                    <button
                                                                        onClick={() => report.section_name && handleUpdateSectionName(report.id, report.section_name)}
                                                                        className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => report.id && handleDelete(report.id)}
                                                                        className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </SortableRow>
                                                );
                                            }

                                            return (
                                                <SortableRow key={report.id} report={report}>
                                                    {({ attributes, listeners }) => (
                                                        <>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-input text-primary focus:ring-ring"
                                                                    checked={report.id ? selectedIds.has(report.id) : false}
                                                                    onChange={() => report.id && toggleSelect(report.id)}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                                                                <GripVertical className="h-5 w-5" />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                                {new Date(report.examination_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                                                {report.dionica || report.stock || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                                {report.draft?.name || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={clsx(
                                                                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                                    report.satisfies
                                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                                                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                                                )}>
                                                                    {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                                <button
                                                                    onClick={() => handleExportPDF(report)}
                                                                    className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                                                    title={t('reports.exportPdf')}
                                                                >
                                                                    <FileDown className="h-4 w-4" />
                                                                </button>
                                                                <Link
                                                                    to={`/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`}
                                                                    className="text-primary hover:text-primary/80 inline-flex items-center"
                                                                    title={t('reports.edit')}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => report.id && handleDelete(report.id)}
                                                                    className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                                                    title={t('reports.delete')}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </SortableRow>
                                            );
                                        })}
                                    </SortableContext>
                                    {filteredWaterReports.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                                {t('reports.noData')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </DndContext>
                </div>
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
