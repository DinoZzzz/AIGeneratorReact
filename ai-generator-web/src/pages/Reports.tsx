import { useEffect, useState, useCallback, useMemo } from 'react';

import { Loader2, Trash2, Edit, FileText, Download, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { ExportDialog } from '../components/ExportDialog';
import type { ExportMetaData } from '../components/ExportDialog';
import type { ReportForm } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReportsPaginated, useDeleteReport } from '../hooks/useReports';
import { TableSkeleton } from '../components/skeletons';
import { errorHandler } from '../lib/errorHandler';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/useConfirm';
import { useLanguage } from '../context/LanguageContext';

// Dynamic imports for export to reduce initial bundle size
const generateWordDocument = async (reports: ReportForm[], metaData: ExportMetaData, userId?: string) => {
    const { generateWordDocument: gen } = await import('../services/wordExportService');
    return gen(reports, metaData, userId);
};

const generateBulkPDF = async (reports: ReportForm[], filename: string) => {
    const { generateBulkPDF: gen } = await import('../lib/pdfGenerator');
    return gen(reports, filename);
};

const PAGE_SIZE = 15;

export const Reports = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const confirm = useConfirm();
    // Keyed by id and holding the full row so selections survive page changes
    const [selectedReports, setSelectedReports] = useState<Map<string, ReportForm>>(new Map());
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [page, setPage] = useState(1);

    // React Query hooks
    const { data, isLoading: loading, isFetching, error } = useReportsPaginated(page, PAGE_SIZE);
    const reports = useMemo(() => data?.data ?? [], [data]);
    const totalCount = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const deleteMutation = useDeleteReport();

    // Keep the page in range when rows are deleted from the last page
    useEffect(() => {
        if (!loading && page > totalPages) {
            setPage(totalPages);
        }
    }, [loading, page, totalPages]);

    // Handle query errors
    useEffect(() => {
        if (error) {
            const appError = errorHandler.handle(error, 'Reports', { logToConsole: true });
            showError(errorHandler.getUserMessage(appError));
        }
    }, [error, showError]);

    const handleDelete = useCallback(async (id: string) => {
        if (!(await confirm({ title: t('reports.deleteConfirm'), variant: 'destructive' }))) return;
        try {
            await deleteMutation.mutateAsync(id);
            // Remove from selection if it was selected
            setSelectedReports(prev => {
                const newSelected = new Map(prev);
                newSelected.delete(id);
                return newSelected;
            });
            success(t('reports.deleteSuccess'));
        } catch (err) {
            const appError = errorHandler.handle(err, 'ReportDelete');
            showError(errorHandler.getUserMessage(appError));
        }
    }, [confirm, t, deleteMutation, success, showError]);

    const toggleSelection = useCallback((report: ReportForm) => {
        setSelectedReports(prev => {
            const newSelected = new Map(prev);
            if (newSelected.has(report.id)) {
                newSelected.delete(report.id);
            } else {
                newSelected.set(report.id, report);
            }
            return newSelected;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedReports(prev => {
            const newSelected = new Map(prev);
            const allPageSelected = reports.length > 0 && reports.every(r => newSelected.has(r.id));
            if (allPageSelected) {
                reports.forEach(r => newSelected.delete(r.id));
            } else {
                reports.forEach(r => newSelected.set(r.id, r));
            }
            return newSelected;
        });
    }, [reports]);

    // Export in list order (newest first), matching the previous full-list behavior
    const getSelectedData = useCallback(() =>
        Array.from(selectedReports.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [selectedReports]
    );

    const handleExportConfirm = useCallback(async (metaData: ExportMetaData) => {
        setIsExporting(true);
        try {
            const selectedData = getSelectedData();
            const exportResult = await generateWordDocument(selectedData, metaData, user?.id);
            success(t(exportResult.historyConflictRecovered ? 'reports.exportHistoryUpdated' : 'reports.exportSuccess'));
        } catch (error) {
            const appError = errorHandler.handle(error, 'ReportExport');
            showError(errorHandler.getUserMessage(appError));
        } finally {
            setIsExporting(false);
        }
    }, [getSelectedData, user?.id, success, t, showError]);

    const handleBulkPDF = useCallback(() => {
        const selectedData = getSelectedData().filter(r => !r.section_name);
        if (selectedData.length === 0) return;
        try {
            generateBulkPDF(selectedData, `Reports_bulk_${Date.now()}.pdf`);
        } catch (err) {
            const appError = errorHandler.handle(err, 'ReportBulkPDF');
            showError(errorHandler.getUserMessage(appError));
        }
    }, [getSelectedData, showError]);

    const handleDeleteSelected = useCallback(async () => {
        const count = selectedReports.size;

        const plural = count > 1 ? 's' : '';
        const confirmMsg = t('reports.deleteSelectedConfirm').replace('{count}', count.toString()).replace('{plural}', plural);
        const finalMsg = t('reports.deleteSelectedFinal').replace('{count}', count.toString()).replace('{plural}', plural);
        if (!(await confirm({ title: confirmMsg, description: finalMsg, variant: 'destructive' }))) {
            return;
        }

        try {
            // Delete all selected reports
            await Promise.all(
                Array.from(selectedReports.keys()).map(id => deleteMutation.mutateAsync(id))
            );

            // Clear selection
            setSelectedReports(new Map());
            const plural = count > 1 ? 's' : '';
            const successMsg = t('reports.deleteSelectedSuccess').replace('{count}', count.toString()).replace('{plural}', plural);
            success(successMsg);
        } catch (err) {
            const appError = errorHandler.handle(err, 'ReportBulkDelete');
            showError(errorHandler.getUserMessage(appError));
        }
    }, [confirm, selectedReports, t, deleteMutation, success, showError]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('reports.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('reports.manageViewReports')}</p>
                    </div>
                </div>
                <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden p-4">
                    <TableSkeleton rows={8} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('reports.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('reports.manageViewReports')}</p>
                </div>
                {selectedReports.size > 0 && (
                    <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleDeleteSelected}
                            className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('reports.delete')} ({selectedReports.size})
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleBulkPDF}
                            className="flex-1 sm:flex-none"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            {t('reports.bulkExportPdf')} ({selectedReports.size})
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setExportDialogOpen(true)}
                            disabled={isExporting}
                            className="flex-1 sm:flex-none"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            {t('reports.export')} ({selectedReports.size})
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-lg font-medium text-foreground">{t('reports.noReports')}</p>
                                <p className="text-sm text-muted-foreground mt-1">{t('reports.reportsFromConstructions')}</p>
                            </div>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div
                                key={report.id}
                                className={cn(
                                    "p-4 space-y-3 transition-colors",
                                    selectedReports.has(report.id) ? "bg-primary/5" : ""
                                )}
                                onClick={() => toggleSelection(report)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 h-5 w-5"
                                                checked={selectedReports.has(report.id)}
                                                onChange={() => toggleSelection(report)}
                                                aria-label={`${t('reports.selectReport')} ${report.construction?.name || ''} - ${new Date(report.examination_date).toLocaleDateString()}`}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {report.type_id === 1 ? t('reports.water') : t('reports.air')} - {report.draft?.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(report.examination_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn(
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
                                        {report.construction?.name || '-'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('customers.workOrder')}: {report.construction?.work_order || '-'}
                                    </div>
                                </div>

                                <div className="pl-8 flex justify-end space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/reports/${report.id}`}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            {t('reports.edit')}
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(report.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('reports.delete')}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <table className="w-full divide-y divide-border table-fixed">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="w-10 px-3 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={reports.length > 0 && reports.every(r => selectedReports.has(r.id))}
                                        onChange={toggleAll}
                                        aria-label={t('reports.selectAllReports')}
                                    />
                                </th>
                                <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('reports.date')}
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('reports.construction')}
                                </th>
                                <th scope="col" className="w-40 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('reports.type')}
                                </th>
                                <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('reports.status')}
                                </th>
                                <th scope="col" className="w-24 relative px-3 py-3">
                                    <span className="sr-only">{t('reports.actions')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className={cn("bg-card divide-y divide-border transition-opacity duration-200", isFetching && !loading && "opacity-50")}>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">{t('reports.noReports')}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{t('reports.reportsFromConstructions')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-3 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={selectedReports.has(report.id)}
                                                onChange={() => toggleSelection(report)}
                                                aria-label={`${t('reports.selectReport')} ${report.construction?.name || ''} - ${new Date(report.examination_date).toLocaleDateString()}`}
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-sm text-foreground">
                                            {new Date(report.examination_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-muted-foreground">
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-foreground truncate" title={report.construction?.name || '-'}>{report.construction?.name || '-'}</span>
                                                <span className="text-xs truncate" title={report.construction?.work_order}>{report.construction?.work_order}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-muted-foreground">
                                            <span className="block truncate" title={`${report.type_id === 1 ? t('reports.water') : t('reports.air')} - ${report.draft?.name || ''}`}>{report.type_id === 1 ? t('reports.water') : t('reports.air')} - {report.draft?.name}</span>
                                        </td>
                                        <td className="px-3 py-4">
                                            <span className={cn(
                                                "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full whitespace-nowrap",
                                                report.satisfies
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-1">
                                                <Button variant="ghost" size="icon" asChild className="action-link">
                                                    <Link to={`/reports/${report.id}`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(report.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 action-link"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalCount > PAGE_SIZE && (
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
                        <span className="text-sm text-foreground">
                            {t('history.page')} {page} {t('history.of')} {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            aria-label={t('common.previous')}
                            className="p-2 rounded-md hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            aria-label={t('common.next')}
                            className="p-2 rounded-md hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                onConfirm={handleExportConfirm}
            />
        </div>
    );
};
