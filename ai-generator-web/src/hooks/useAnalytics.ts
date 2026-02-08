import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
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

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                // Report forms: pass/fail + durations by type
                let query = supabase
                    .from('report_forms')
                    .select('satisfies, type_id, examination_duration, created_at, user_id');

                if (userId) {
                    query = query.eq('user_id', userId);
                }

                const { data: forms, error: formsError } = await query;
                if (formsError) throw formsError;
                if (!isMounted) return;

                let customersCount = 0;
                let constructionsCount = 0;

                if (!userId) {
                    const { count: custCount, error: customersError } = await supabase
                        .from('customers')
                        .select('*', { count: 'exact', head: true });
                    if (customersError) throw customersError;
                    if (!isMounted) return;
                    customersCount = custCount || 0;

                    const { count: constCount, error: constructionsError } = await supabase
                        .from('constructions')
                        .select('*', { count: 'exact', head: true });
                    if (constructionsError) throw constructionsError;
                    if (!isMounted) return;
                    constructionsCount = constCount || 0;
                }

                if (!isMounted) return;

                const computed = computeAnalyticsFromForms((forms ?? []) as AnalyticsFormRow[], {
                    totalCustomers: customersCount,
                    totalConstructions: constructionsCount,
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
