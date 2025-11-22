import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Plus, Pencil, Trash2, FileDown, ArrowLeft, Loader2, GripVertical } from 'lucide-react';
import type { ReportForm, Construction, Customer } from '../types';
import clsx from 'clsx';
import { generatePDF, generateBulkPDF } from '../lib/pdfGenerator';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isNewReportOpen, setIsNewReportOpen] = useState(false);

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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="text-sm text-gray-500">
                            for {construction.name} ({construction.work_order}) - {customer.name}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="h-5 w-5 mr-2" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setIsNewReportOpen(!isNewReportOpen)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Report
                        </button>
                        {isNewReportOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <Link
                                        to={`/customers/${customerId}/constructions/${constructionId}/reports/new/water`}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        onClick={() => setIsNewReportOpen(false)}
                                    >
                                        Water Method
                                    </Link>
                                    <Link
                                        to={`/customers/${customerId}/constructions/${constructionId}/reports/new/air`}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        onClick={() => setIsNewReportOpen(false)}
                                    >
                                        Air Method
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Overlay to close dropdown when clicking outside */}
                    {isNewReportOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsNewReportOpen(false)}
                        />
                    )}
                    <button
                        onClick={handleBulkExport}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <FileDown className="h-5 w-5 mr-2 text-gray-500" />
                        {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export All'}
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-10 px-6 py-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={reports.length > 0 && selectedIds.size === reports.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="w-10 px-6 py-3"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draft</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report, index) => (
                            <tr
                                key={report.id}
                                className="hover:bg-gray-50 cursor-move"
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(index)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={report.id ? selectedIds.has(report.id) : false}
                                        onChange={() => report.id && toggleSelect(report.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-400 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(report.examination_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.type_id === 1 ? 'Water' : 'Air'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.draft?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        report.satisfies
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    )}>
                                        {report.satisfies ? 'Satisfies' : 'Failed'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button
                                        onClick={() => handleExportPDF(report)}
                                        className="text-gray-600 hover:text-gray-900 inline-flex items-center"
                                        title="Export PDF"
                                    >
                                        <FileDown className="h-4 w-4" />
                                    </button>
                                    <Link
                                        to={report.type_id === 1
                                            ? `/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`
                                            : `/customers/${customerId}/constructions/${constructionId}/reports/air/${report.id}`
                                        }
                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => report.id && handleDelete(report.id)}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
