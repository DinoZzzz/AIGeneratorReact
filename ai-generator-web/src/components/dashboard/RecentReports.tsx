import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, Clock, Droplets, Wind } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

interface RecentReport {
    id: string;
    dionica: string | null;
    section_name: string | null;
    type_id: number;
    satisfies: boolean;
    customer_id: string | null;
    construction_id: string | null;
    created_at: string;
    construction: { name: string } | null;
}

const useRecentReports = () => {
    return useQuery({
        queryKey: ['dashboard', 'recent-reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_forms')
                .select('id, dionica, section_name, type_id, satisfies, customer_id, construction_id, created_at, construction:constructions(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data as RecentReport[];
        },
        staleTime: 2 * 60 * 1000,
    });
};

function getReportHref(report: RecentReport): string {
    const isAir = report.type_id === 2;
    if (report.construction_id && report.customer_id) {
        const base = `/customers/${report.customer_id}/constructions/${report.construction_id}/reports`;
        return isAir ? `${base}/air/${report.id}` : `${base}/${report.id}`;
    }
    return isAir ? `/reports/air/${report.id}` : `/reports/${report.id}`;
}

const RecentReportsComponent = () => {
    const { t } = useLanguage();
    const { data: reports = [], isLoading } = useRecentReports();

    if (isLoading) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {t('dashboard.recentReports')}
                </h3>
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-bold">{t('dashboard.recentReports')}</h3>
            </div>
            <div className="divide-y divide-border">
                {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        {t('reports.noReports')}
                    </p>
                ) : (
                    reports.map((report) => (
                        <Link
                            key={report.id}
                            to={getReportHref(report)}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                        >
                            <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                report.type_id === 2 ? "bg-sky-100 dark:bg-sky-950" : "bg-blue-100 dark:bg-blue-950"
                            )}>
                                {report.type_id === 2
                                    ? <Wind className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    : <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {report.dionica || report.section_name || t('reports.title')}
                                </p>
                                {report.construction?.name && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {report.construction.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {report.satisfies ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export const RecentReports = memo(RecentReportsComponent);
RecentReports.displayName = 'RecentReports';
