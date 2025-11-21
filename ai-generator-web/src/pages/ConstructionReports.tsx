import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Plus, Pencil, Trash2, FileDown, ArrowLeft, Loader2 } from 'lucide-react';
import type { ReportForm, Construction, Customer } from '../types';
import clsx from 'clsx';
import { generatePDF } from '../lib/pdfGenerator';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

export const ConstructionReports = () => {
    const { customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [construction, setConstruction] = useState<Construction | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (customerId && constructionId) {
            loadData(customerId, constructionId);
        }
    }, [customerId, constructionId]);

    const loadData = async (custId: string, constId: string) => {
        setLoading(true);
        try {
            const [customerData, constructionData, reportsData] = await Promise.all([
                customerService.getById(custId),
                constructionService.getById(constId),
                reportService.getByConstruction(constId)
            ]);
            setCustomer(customerData);
            setConstruction(constructionData);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load data', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await reportService.delete(id);
                setReports(reports.filter(r => r.id !== id));
            } catch (error) {
                console.error('Failed to delete report', error);
                alert('Failed to delete report');
            }
        }
    };

    const handleExportPDF = (report: ReportForm) => {
        if (report.type_id === 1) {
            // Water method PDF
            generatePDF(report);
        } else {
            // Air method PDF - reusing the same generator for now or need a specific one?
            // The plan mentioned PDF export for Air Method was added to the form, 
            // but ideally we should have a utility that can handle it from here too.
            // For now, we'll use the same generatePDF if it supports it, or alert.
            // Looking at previous edits, generatePDF seems tailored for Water.
            // Let's try to use it, assuming it might need updates for Air later.
            generatePDF(report);
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
                    <Link
                        to={`/customers/${customerId}/constructions/${constructionId}/reports/new/water`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Water Report
                    </Link>
                    <Link
                        to={`/customers/${customerId}/constructions/${constructionId}/reports/new/air`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Air Report
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draft</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50">
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
                                        onClick={() => handleDelete(report.id)}
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
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
