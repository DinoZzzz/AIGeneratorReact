import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Plus, Pencil, Trash2, FileDown, ArrowLeft, Loader2, GripVertical, FileText } from 'lucide-react';
import type { ReportForm, Construction, Customer } from '../types';
import clsx from 'clsx';
import { generatePDF, generateBulkPDF } from '../lib/pdfGenerator';
import { generateWordDocument } from '../services/wordExportService';
import { ExportDialog } from '../components/ExportDialog';
import type { ExportMetaData } from '../components/ExportDialog';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../context/AuthContext';

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isNewReportOpen, setIsNewReportOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Check accreditations (1 = Water, 2 = Air)
    const hasWaterAccreditation = profile?.accreditations?.includes(1) ?? false;
    const hasAirAccreditation = profile?.accreditations?.includes(2) ?? false;
    const hasAnyAccreditation = hasWaterAccreditation || hasAirAccreditation;

    useEffect(() => {
        if (customerId && constructionId) {
            loadData();
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
        generatePDF(report);
    };

    const handleBulkExport = () => {
        if (reports.length === 0) return;

        const reportsToExport = selectedIds.size > 0
            ? reports.filter(r => r.id && selectedIds.has(r.id))
            : reports;

        generateBulkPDF(reportsToExport, `Reports_${construction?.work_order || 'bundle'}.pdf`);
    };

    const handleExportConfirm = async (metaData: ExportMetaData, dialogSelectedReports?: ReportForm[]) => {
        setIsExporting(true);
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
        } catch (error) {
            console.error(error);
            alert('Failed to generate report');
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer || !construction) {
        return <div>Data not found</div>;
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[
                { label: 'Customers', path: '/customers' },
                { label: customer.name, path: `/customers` },
                { label: construction.name, path: `/customers/${customerId}/constructions` },
                { label: 'Reports' }
            ]} />

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/customers/${customerId}/constructions`)}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                        <p className="text-sm text-muted-foreground">
                            for {construction.name} ({construction.work_order}) - {customer.name}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center px-4 py-2 border border-destructive/40 rounded-md shadow-sm text-sm font-medium text-destructive bg-transparent hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
                        >
                            <Trash2 className="h-5 w-5 mr-2" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setIsNewReportOpen(!isNewReportOpen)}
                            disabled={!hasAnyAccreditation}
                            title={!hasAnyAccreditation ? "You don't have any accreditations" : ""}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Report
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
                                            Water Method
                                        </Link>
                                    )}
                                    {hasAirAccreditation && (
                                        <Link
                                            to={`/customers/${customerId}/constructions/${constructionId}/reports/new/air`}
                                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                            role="menuitem"
                                            onClick={() => setIsNewReportOpen(false)}
                                        >
                                            Air Method
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
                        className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                    >
                        <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                        Generate Reports
                    </button>
                    <button
                        onClick={handleBulkExport}
                        className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                    >
                        <FileDown className="h-5 w-5 mr-2 text-muted-foreground" />
                        {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export All'}
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
            />

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dionica</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Draft</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {reports.map((report, index) => (
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
                                        {report.satisfies ? 'Satisfies' : 'Failed'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button
                                        onClick={() => handleExportPDF(report)}
                                        className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                        title="Export PDF"
                                    >
                                        <FileDown className="h-4 w-4" />
                                    </button>
                                    <Link
                                        to={report.type_id === 1
                                            ? `/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`
                                            : `/customers/${customerId}/constructions/${constructionId}/reports/air/${report.id}`
                                        }
                                        className="text-primary hover:text-primary/80 inline-flex items-center"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => report.id && handleDelete(report.id)}
                                        className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                    No reports found for this construction site.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
