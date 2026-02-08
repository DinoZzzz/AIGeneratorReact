import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsStats {
    pass: number;
    fail: number;
    avgWater: number;
    avgAir: number;
    avgDuration: number;
    totalReports: number;
    totalCustomers: number;
    totalConstructions: number;
    recentReports: number;
    previousWeekReports: number;
    weeklyMomentum: number;
    passRate: number;
    failRate: number;
    waterReports: number;
    airReports: number;
    avgDailyReports: number;
}

interface DailyTrendPoint {
    date: string;
    label: string;
    total: number;
    pass: number;
    fail: number;
}

interface MethodMixPoint {
    type: 'water' | 'air';
    count: number;
    percentage: number;
}

interface DurationBucketPoint {
    bucket: 'under15' | '15to30' | '30to60' | 'over60';
    count: number;
}

interface WeekdayActivityPoint {
    day: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
    total: number;
}

const DAYS_WINDOW = 30;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDayLabel = (date: Date) =>
    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

const parseDurationMinutes = (val?: string | null) => {
    if (!val) return 0;
    const parts = val.split(':').map(Number);
    if (parts.length >= 2) {
        const [h, m, s = 0] = parts;
        return h * 60 + m + s / 60;
    }
    return 0;
};

export const useAnalytics = (userId?: string) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalyticsStats>({
        pass: 0,
        fail: 0,
        avgWater: 0,
        avgAir: 0,
        avgDuration: 0,
        totalReports: 0,
        totalCustomers: 0,
        totalConstructions: 0,
        recentReports: 0,
        previousWeekReports: 0,
        weeklyMomentum: 0,
        passRate: 0,
        failRate: 0,
        waterReports: 0,
        airReports: 0,
        avgDailyReports: 0,
    });
    const [dailyTrend, setDailyTrend] = useState<DailyTrendPoint[]>([]);
    const [methodMix, setMethodMix] = useState<MethodMixPoint[]>([]);
    const [durationBuckets, setDurationBuckets] = useState<DurationBucketPoint[]>([
        { bucket: 'under15', count: 0 },
        { bucket: '15to30', count: 0 },
        { bucket: '30to60', count: 0 },
        { bucket: 'over60', count: 0 },
    ]);
    const [weekdayActivity, setWeekdayActivity] = useState<WeekdayActivityPoint[]>([
        { day: 'sun', total: 0 },
        { day: 'mon', total: 0 },
        { day: 'tue', total: 0 },
        { day: 'wed', total: 0 },
        { day: 'thu', total: 0 },
        { day: 'fri', total: 0 },
        { day: 'sat', total: 0 },
    ]);

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

                let pass = 0;
                let fail = 0;
                let waterDuration = 0;
                let waterCount = 0;
                let airDuration = 0;
                let airCount = 0;
                let totalDuration = 0;
                let durationCount = 0;
                const totalReports = forms?.length || 0;

                let recentReports = 0;
                let previousWeekReports = 0;
                let waterReports = 0;
                let airReports = 0;

                const now = Date.now();
                const dailyMap = new Map<string, DailyTrendPoint>();
                const dayCounters: WeekdayActivityPoint[] = [
                    { day: 'sun', total: 0 },
                    { day: 'mon', total: 0 },
                    { day: 'tue', total: 0 },
                    { day: 'wed', total: 0 },
                    { day: 'thu', total: 0 },
                    { day: 'fri', total: 0 },
                    { day: 'sat', total: 0 },
                ];

                for (let i = DAYS_WINDOW - 1; i >= 0; i -= 1) {
                    const date = new Date();
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() - i);
                    const key = toDateKey(date);
                    dailyMap.set(key, {
                        date: key,
                        label: formatDayLabel(date),
                        total: 0,
                        pass: 0,
                        fail: 0,
                    });
                }

                let under15 = 0;
                let from15to30 = 0;
                let from30to60 = 0;
                let over60 = 0;

                forms?.forEach((f) => {
                    if (f.satisfies) pass += 1;
                    else fail += 1;

                    const minutes = parseDurationMinutes(f.examination_duration);
                    if (f.type_id === 1) {
                        waterDuration += minutes;
                        waterCount += 1;
                        waterReports += 1;
                    } else if (f.type_id === 2) {
                        airDuration += minutes;
                        airCount += 1;
                        airReports += 1;
                    }

                    if (minutes > 0) {
                        totalDuration += minutes;
                        durationCount += 1;
                        if (minutes < 15) under15 += 1;
                        else if (minutes < 30) from15to30 += 1;
                        else if (minutes < 60) from30to60 += 1;
                        else over60 += 1;
                    }

                    if (!f.created_at) return;

                    const createdAt = new Date(f.created_at);
                    const createdAtMs = createdAt.getTime();

                    if (createdAtMs >= now - WEEK_MS) {
                        recentReports += 1;
                    } else if (createdAtMs >= now - WEEK_MS * 2) {
                        previousWeekReports += 1;
                    }

                    const dayIndex = createdAt.getDay();
                    dayCounters[dayIndex].total += 1;

                    const dateKey = toDateKey(createdAt);
                    const point = dailyMap.get(dateKey);
                    if (point) {
                        point.total += 1;
                        if (f.satisfies) point.pass += 1;
                        else point.fail += 1;
                    }
                });

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

                const avgWater = waterCount ? +(waterDuration / waterCount).toFixed(1) : 0;
                const avgAir = airCount ? +(airDuration / airCount).toFixed(1) : 0;
                const avgDuration = durationCount ? +(totalDuration / durationCount).toFixed(1) : 0;
                const passRate = totalReports ? +((pass / totalReports) * 100).toFixed(1) : 0;
                const failRate = totalReports ? +((fail / totalReports) * 100).toFixed(1) : 0;
                const weeklyMomentum = previousWeekReports > 0
                    ? +(((recentReports - previousWeekReports) / previousWeekReports) * 100).toFixed(1)
                    : (recentReports > 0 ? 100 : 0);
                const avgDailyReports = +(recentReports / 7).toFixed(1);

                const trendData = Array.from(dailyMap.values());
                setDailyTrend(trendData);
                setWeekdayActivity(dayCounters);
                setDurationBuckets([
                    { bucket: 'under15', count: under15 },
                    { bucket: '15to30', count: from15to30 },
                    { bucket: '30to60', count: from30to60 },
                    { bucket: 'over60', count: over60 },
                ]);
                setMethodMix([
                    {
                        type: 'water',
                        count: waterReports,
                        percentage: totalReports ? +((waterReports / totalReports) * 100).toFixed(1) : 0,
                    },
                    {
                        type: 'air',
                        count: airReports,
                        percentage: totalReports ? +((airReports / totalReports) * 100).toFixed(1) : 0,
                    },
                ]);

                setStats({
                    pass,
                    fail,
                    avgWater,
                    avgAir,
                    avgDuration,
                    totalReports,
                    totalCustomers: customersCount,
                    totalConstructions: constructionsCount,
                    recentReports,
                    previousWeekReports,
                    weeklyMomentum,
                    passRate,
                    failRate,
                    waterReports,
                    airReports,
                    avgDailyReports,
                });
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
