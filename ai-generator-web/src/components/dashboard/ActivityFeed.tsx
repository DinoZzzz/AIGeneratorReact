import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileText, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { enUS, hr } from 'date-fns/locale';

interface ActivityItem {
    id: string;
    dionica: string | null;
    section_name: string | null;
    type_id: number;
    customer_id: string | null;
    construction_id: string | null;
    created_at: string;
    updated_at: string;
    construction: { name: string } | null;
}

const useRecentActivity = () => {
    return useQuery({
        queryKey: ['dashboard', 'activity'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('report_forms')
                .select('id, dionica, section_name, type_id, customer_id, construction_id, created_at, updated_at, construction:constructions(name)')
                .order('updated_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data as ActivityItem[];
        },
        staleTime: 2 * 60 * 1000,
    });
};

const ActivityFeedComponent = () => {
    const { t, language } = useLanguage();
    const { data: activities = [], isLoading } = useRecentActivity();
    const dateFnsLocale = language === 'hr' ? hr : enUS;

    if (isLoading) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {t('dashboard.activityFeed')}
                </h3>
                <div className="animate-pulse space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 bg-muted rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-bold">{t('dashboard.activityFeed')}</h3>
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        {t('dashboard.noActivity')}
                    </p>
                ) : (
                    activities.map((item) => {
                        const isNew = item.created_at === item.updated_at;
                        const isAir = item.type_id === 2;
                        const basePath = item.construction_id && item.customer_id
                            ? `/customers/${item.customer_id}/constructions/${item.construction_id}/reports`
                            : '/reports';
                        const href = isAir ? `${basePath}/air/${item.id}` : `${basePath}/${item.id}`;

                        return (
                            <Link
                                key={item.id}
                                to={href}
                                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                            >
                                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">
                                        <span className="font-medium">
                                            {isNew ? t('dashboard.activityCreated') : t('dashboard.activityUpdated')}
                                        </span>
                                        {' '}
                                        {item.dionica || item.section_name || t('reports.title')}
                                    </p>
                                    {item.construction?.name && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.construction.name}
                                        </p>
                                    )}
                                </div>
                                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: dateFnsLocale })}
                                </span>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const ActivityFeed = memo(ActivityFeedComponent);
ActivityFeed.displayName = 'ActivityFeed';
