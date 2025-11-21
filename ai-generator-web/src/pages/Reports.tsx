import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import type { ReportForm } from '../types';
import { Loader2, Plus, Trash2, Edit, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export const Reports = () => {
    const [reports, setReports] = useState<ReportForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await reportService.getAll();
            setReports(data);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await reportService.delete(id);
            setReports(reports.filter(r => r.id !== id));
        } catch (err: unknown) {
            alert('Failed to delete report: ' + (err as Error).message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
                    <p className="text-muted-foreground mt-1">Manage and view all test reports.</p>
                </div>
                <Button asChild>
                    <Link to="/reports/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Report
                    </Link>
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">No reports found</p>
                                            <p className="text-sm text-muted-foreground mt-1">Get started by creating a new test report.</p>
                                            <Button variant="outline" className="mt-4" asChild>
                                                <Link to="/reports/new">Create Report</Link>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/50 transition-colors">
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
        </div>
    );
};
