import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import type { ReportExport, ReportExportForm } from '../types';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';

export const HistoryDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [exportData, setExportData] = useState<ReportExport | null>(null);
    const [forms, setForms] = useState<ReportExportForm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [exportResult, formsResult] = await Promise.all([
                    historyService.getById(id),
                    historyService.getExportForms(id)
                ]);
                setExportData(exportResult);
                setForms(formsResult);
            } catch (error) {
                console.error('Failed to load export details:', error);
                alert('Failed to load details.');
                navigate('/history');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!exportData) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/history')}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    Export Details: {exportData.construction_part}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Metadata Card */}
                <div className="bg-white shadow rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Information</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Certifier</p>
                            <p className="font-medium">{exportData.certifier?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Created By</p>
                            <p className="font-medium">{exportData.user?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Examination Date</p>
                            <p className="font-medium">{new Date(exportData.examination_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Creation Time</p>
                            <p className="font-medium">{new Date(exportData.created_at).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500">Drainage</p>
                            <p className="font-medium">{exportData.drainage || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Remarks Card */}
                <div className="bg-white shadow rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Remarks & Deviations</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500">Water Remark</p>
                            <p className="font-medium">{exportData.water_remark || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Water Deviation</p>
                            <p className="font-medium">{exportData.water_deviation || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Air Remark</p>
                            <p className="font-medium">{exportData.air_remark || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Air Deviation</p>
                            <p className="font-medium">{exportData.air_deviation || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Included Reports */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Included Reports ({forms.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ordinal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Satisfies
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Measurements
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {forms.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        #{item.ordinal + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.type_id === 1 ? 'Water' : 'Air'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            item.report_form?.satisfies
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.report_form?.satisfies ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Quick overview of key stats */}
                                        {item.report_form && (
                                            <div className="flex gap-2">
                                                <span title="Pipe Length">L: {item.report_form.pipe_length}m</span>
                                                <span title="Diameter">Ø: {item.report_form.pipe_diameter}mm</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {/*
                                            Here we could link to the actual report editor or viewer if needed.
                                            For now, just a placeholder button.
                                        */}
                                        <button className="text-indigo-600 hover:text-indigo-900 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                                            <FileText className="h-4 w-4 mr-1" /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
