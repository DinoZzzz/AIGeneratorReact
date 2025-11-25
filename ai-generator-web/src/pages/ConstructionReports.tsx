import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Loader2, Plus, FileText, Trash2, ArrowLeft, FileDown, Pencil, Type, GripVertical } from 'lucide-react';
import type { ReportForm, Construction, Customer, ReportFile } from '../types';
import clsx from 'clsx';
import { generatePDF, generateBulkPDF } from '../lib/pdfGenerator';
import { generateWordDocument } from '../services/wordExportService';
import { ExportDialog } from '../components/ExportDialog';
import type { ExportMetaData } from '../components/ExportDialog';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isNewReportOpen, setIsNewReportOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<ReportFile[]>([]);

    // Pagination, Search & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | '1' | '2'>('all'); // 1=Water, 2=Air
    const [statusFilter, setStatusFilter] = useState<'all' | 'satisfies' | 'failed'>('all');
    const [dateFilter, setDateFilter] = useState('');

    const ITEMS_PER_PAGE = 15;

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

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, statusFilter, dateFilter]);

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
            ? reports.filter(r => r.id && selectedIds.has(r.id))
            : reports;

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
                reportsToExport = dialogSelectedReports;
            } else if (selectedIds.size > 0) {
                reportsToExport = reports.filter(r => r.id && selectedIds.has(r.id));
            } else {
                // Fallback: if no selection in dialog (shouldn't happen due to validation) and no pre-selection
                reportsToExport = reports;
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

    const toggleSelectAll = () => {
        if (selectedIds.size === reports.length) {
            setSelectedIds(new Set());
        } else {
            // Filter out undefined IDs if any
            const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
            setSelectedIds(new Set(allIds));
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

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (dropIndex: number) => {
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newReports = [...reports];
        const [draggedItem] = newReports.splice(draggedIndex, 1);
        newReports.splice(dropIndex, 0, draggedItem);

        // Optimistic update
        setReports(newReports);
        setDraggedIndex(null);

        try {
            await reportService.updateOrder(newReports);
        } catch (error) {
            console.error('Failed to update order', error);
            alert('Failed to save new order');
        }
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

    const handleAddSection = async () => {
        const name = window.prompt(t('reports.enterSectionName'));
        if (!name) return;

        try {
            const maxOrdinal = reports.length > 0 ? Math.max(...reports.map(r => r.ordinal)) : 0;
            const newSection = await reportService.create({
                construction_id: constructionId,
                section_name: name,
                ordinal: maxOrdinal + 1,
                // type_id is null for sections
            });
            setReports([...reports, newSection]);
        } catch (error) {
            console.error('Failed to create section:', error);
            alert('Failed to create section');
        }
    };

    const handleUpdateSectionName = async (id: string, currentName: string) => {
        const newName = window.prompt(t('reports.enterSectionName'), currentName);
        if (!newName || newName === currentName) return;

        try {
            await reportService.update(id, { section_name: newName });
            setReports(reports.map(r => r.id === id ? { ...r, section_name: newName } : r));
        } catch (error) {
            console.error('Failed to update section name:', error);
            alert('Failed to update section name');
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

    // Pagination
    // Apply filters and search
    const filteredReports = reports.filter(report => {
        // Search by dionica/stock
        if (searchTerm && !report.dionica?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !report.stock?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by type
        if (typeFilter !== 'all' && report.type_id !== parseInt(typeFilter)) {
            // Allow sections to pass through type filter if we want them visible always?
            // Or maybe filter them out? Usually sections are structural, so maybe keep them?
            // For now, let's hide sections if filtering by specific type, UNLESS we want to see structure.
            // But wait, sections have no type_id. So they will be filtered out here.
            // Let's allow sections if they exist.
            if (!report.type_id && report.section_name) return true;
            return false;
        }

        // Filter by status
        if (statusFilter !== 'all') {
            // Sections don't have status, so maybe hide them? Or show?
            if (!report.type_id && report.section_name) return true;
            if (statusFilter === 'satisfies' && !report.satisfies) return false;
            if (statusFilter === 'failed' && report.satisfies) return false;
        }

        // Filter by date
        if (dateFilter) {
            // Sections might not have date.
            if (!report.type_id && report.section_name) return true;
            const reportDate = new Date(report.examination_date).toISOString().split('T')[0];
            if (reportDate !== dateFilter) return false;
        }

        return true;
    });

    // Pagination
    const totalCount = filteredReports.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    return (
        <div className="space-y-6">
            {actionMessage && (
                <div className={`px-4 py-3 rounded-md border ${actionMessage.type === 'error' ? 'border-destructive text-destructive bg-destructive/10' : 'border-border text-foreground bg-muted/50'}`}>
                    {actionMessage.text}
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
                            disabled={!hasAnyAccreditation}
                            title={!hasAnyAccreditation ? "You don't have any accreditations" : ""}
                            className="inline-flex items-center px-3 py-2 md:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">{t('reports.newReport')}</span>
                            <span className="md:hidden">{t('reports.new')}</span>
                        </button>
                        <button
                            onClick={handleAddSection}
                            className="ml-2 inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                        >
                            <Type className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">{t('reports.addSection')}</span>
                        </button>
                        {isNewReportOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border shadow-border/40 focus:outline-none z-50">
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

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="p-4 border-b border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    {/* Type Filter */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1">
                            {t('reports.type')}
                        </label>
                        <select
                            id="type"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="1">{t('reports.water')}</option>
                            <option value="2">{t('reports.air')}</option>
                        </select>
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

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border">
                    {paginatedReports.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-lg font-medium text-foreground">{t('reports.noData')}</p>
                            </div>
                        </div>
                    ) : (
                        paginatedReports.map((report) => {
                            const isSection = !report.type_id && report.section_name;

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
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="w-10 px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-ring"
                                        checked={reports.length > 0 && selectedIds.size === reports.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.type')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.dionica')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.draft')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {paginatedReports.map((report, index) => {
                                const isSection = !report.type_id && report.section_name;

                                if (isSection) {
                                    return (
                                        <tr
                                            key={report.id}
                                            className="bg-muted/30 hover:bg-muted/50 cursor-move transition-colors"
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(index)}
                                        >
                                            <td className="w-10 px-6 py-4">
                                                <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                                            </td>
                                            <td colSpan={6} className="px-6 py-4">
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
                                        </tr>
                                    );
                                }

                                return (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-muted/50 cursor-move transition-colors"
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-ring"
                                                checked={report.id ? selectedIds.has(report.id) : false}
                                                onChange={() => report.id && toggleSelect(report.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-5 w-5" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {new Date(report.examination_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {report.type_id === 1 ? 'Water' : 'Air'}
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
                                    </tr>
                                );
                            })}
                            {paginatedReports.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                        {t('reports.noData')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalCount > 0 && totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            {t('customers.showing')} {startIndex + 1} {t('customers.to')} {Math.min(endIndex, totalCount)} {t('customers.of')} {totalCount} {t('customers.results')}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('customers.prev')}
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {t('history.page')} {currentPage} {t('history.of')} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('customers.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
