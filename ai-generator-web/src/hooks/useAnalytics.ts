import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { getAllFromStore, STORES } from '../lib/offlineDb';
import { isNetworkError } from '../lib/errorHandler';
import {
    computeAnalyticsFromForms,
    createInitialDurationBuckets,
    createInitialStats,
    createInitialWeekdayActivity,
    type AnalyticsFormRow,
    type AnalyticsStats,
    type DailyTrendPoint,
    type DurationBucketPoint,
    type MethodMixPoint,
    type WeekdayActivityPoint,
} from '../lib/analytics';

export const useAnalytics = (userId?: string) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalyticsStats>(createInitialStats);
    const [dailyTrend, setDailyTrend] = useState<DailyTrendPoint[]>([]);
    const [methodMix, setMethodMix] = useState<MethodMixPoint[]>([]);
    const [durationBuckets, setDurationBuckets] = useState<DurationBucketPoint[]>(createInitialDurationBuckets);
    const [weekdayActivity, setWeekdayActivity] = useState<WeekdayActivityPoint[]>(createInitialWeekdayActivity);

    useEffect(() => {
        let isMounted = true;

        const fetchOnline = async () => {
            // Report forms: pass/fail + durations by type
            let query = supabase
                .from('report_forms')
                .select('satisfies, type_id, examination_duration, created_at, user_id');

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const [formsResult, customersResult, constructionsResult] = await Promise.all([
                query,
                userId ? Promise.resolve(null) : supabase.from('customers').select('id', { count: 'exact', head: true }),
                userId ? Promise.resolve(null) : supabase.from('constructions').select('id', { count: 'exact', head: true }),
            ]);

            const { data: forms, error: formsError } = formsResult;
            if (formsError) throw formsError;
            if (customersResult?.error) throw customersResult.error;
            if (constructionsResult?.error) throw constructionsResult.error;

            return {
                forms: (forms ?? []) as AnalyticsFormRow[],
                totalCustomers: customersResult?.count || 0,
                totalConstructions: constructionsResult?.count || 0,
            };
        };

        // Offline: compute the same analytics from the replicated local data.
        const fetchOffline = async () => {
            const [reports, customers, constructions] = await Promise.all([
                getAllFromStore<AnalyticsFormRow & { user_id?: string }>(STORES.REPORTS),
                userId ? Promise.resolve([]) : getAllFromStore(STORES.CUSTOMERS),
                userId ? Promise.resolve([]) : getAllFromStore(STORES.CONSTRUCTIONS),
            ]);

            return {
                forms: userId ? reports.filter((report) => report.user_id === userId) : reports,
                totalCustomers: customers.length,
                totalConstructions: constructions.length,
            };
        };

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const source = navigator.onLine
                    ? await fetchOnline().catch(async (err) => {
                        if (!isNetworkError(err)) throw err;
                        return fetchOffline();
                    })
                    : await fetchOffline();

                if (!isMounted) return;

                const computed = computeAnalyticsFromForms(source.forms, {
                    totalCustomers: source.totalCustomers,
                    totalConstructions: source.totalConstructions,
                });

                setStats(computed.stats);
                setDailyTrend(computed.dailyTrend);
                setMethodMix(computed.methodMix);
                setDurationBuckets(computed.durationBuckets);
                setWeekdayActivity(computed.weekdayActivity);
            } catch (err: unknown) {
                if (!isMounted) return;
                console.error('Failed to load analytics', err);
                setError(t('analytics.error'));
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [userId, t]);

    return { stats, dailyTrend, methodMix, durationBuckets, weekdayActivity, loading, error };
};
