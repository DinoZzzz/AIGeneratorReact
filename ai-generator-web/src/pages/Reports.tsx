import { useEffect, useState } from 'react';

import { Loader2, Trash2, Edit, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { ExportDialog } from '../components/ExportDialog';
import type { ExportMetaData } from '../components/ExportDialog';
import { generateWordDocument } from '../services/wordExportService';
import { useAuth } from '../context/AuthContext';
import { useReports, useDeleteReport } from '../hooks/useReports';
import { TableSkeleton } from '../components/skeletons';
import { errorHandler } from '../lib/errorHandler';
import { useToast } from '../context/ToastContext';

export const Reports = () => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // React Query hooks
    const { data: reports = [], isLoading: loading, error } = useReports();
    const deleteMutation = useDeleteReport();

    // Handle query errors
    useEffect(() => {
        if (error) {
            const appError = errorHandler.handle(error, 'Reports', { logToConsole: true });
            showError(errorHandler.getUserMessage(appError));
        }
    }, [error, showError]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            // Remove from selection if it was selected
            const newSelected = new Set(selectedReports);
            newSelected.delete(id);
            setSelectedReports(newSelected);
            success('Report deleted successfully');
        } catch (err) {
            const appError = errorHandler.handle(err, 'ReportDelete');
            showError(errorHandler.getUserMessage(appError));
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedReports);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedReports(newSelected);
    };

    const toggleAll = () => {
        if (selectedReports.size === reports.length) {
            setSelectedReports(new Set());
        } else {
            setSelectedReports(new Set(reports.map(r => r.id)));
        }
    };

    const handleExportConfirm = async (metaData: ExportMetaData) => {
        setIsExporting(true);
        try {
            const selectedData = reports.filter(r => selectedReports.has(r.id));
            await generateWordDocument(selectedData, metaData, user?.id);
            success('Report exported successfully');
        } catch (error) {
            const appError = errorHandler.handle(error, 'ReportExport');
            showError(errorHandler.getUserMessage(appError));
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteSelected = async () => {
        const count = selectedReports.size;

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
                Array.from(selectedReports).map(id => deleteMutation.mutateAsync(id))
            );

            // Clear selection
            setSelectedReports(new Set());
            success(`Successfully deleted ${count} report${count > 1 ? 's' : ''}`);
        } catch (err) {
            const appError = errorHandler.handle(err, 'ReportBulkDelete');
            showError(errorHandler.getUserMessage(appError));
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
                        <p className="text-muted-foreground mt-1">Manage and view all test reports.</p>
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
                    <p className="text-muted-foreground mt-1">Manage and view all test reports.</p>
                </div>
                {selectedReports.size > 0 && (
                    <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleDeleteSelected}
                            className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete ({selectedReports.size})
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
                            Export ({selectedReports.size})
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
                                <p className="text-lg font-medium text-foreground">No reports found</p>
                                <p className="text-sm text-muted-foreground mt-1">Reports are created from construction sites.</p>
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
                                onClick={() => toggleSelection(report.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 h-5 w-5"
                                                checked={selectedReports.has(report.id)}
                                                onChange={() => toggleSelection(report.id)}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {report.type_id === 1 ? 'Water' : 'Air'} - {report.draft?.name}
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
                                        {report.satisfies ? 'Satisfies' : 'Failed'}
                                    </span>
                                </div>

                                <div className="pl-8 space-y-1">
                                    <div className="text-sm text-foreground font-medium">
                                        {report.construction?.name || '-'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Work Order: {report.construction?.work_order || '-'}
                                    </div>
                                </div>

                                <div className="pl-8 flex justify-end space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/reports/${report.id}`}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(report.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={reports.length > 0 && selectedReports.size === reports.length}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Construction
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">No reports found</p>
                                            <p className="text-sm text-muted-foreground mt-1">Reports are created from construction sites.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={selectedReports.has(report.id)}
                                                onChange={() => toggleSelection(report.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {new Date(report.examination_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{report.construction?.name || '-'}</span>
                                                <span className="text-xs">{report.construction?.work_order}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {report.type_id === 1 ? 'Water' : 'Air'} - {report.draft?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full",
                                                report.satisfies
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {report.satisfies ? 'Satisfies' : 'Failed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link to={`/reports/${report.id}`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(report.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
            </div>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                onConfirm={handleExportConfirm}
            />
        </div>
    );
};
