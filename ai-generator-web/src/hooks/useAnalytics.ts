import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsStats {
    pass: number;
    fail: number;
    avgWater: number;
    avgAir: number;
    totalReports: number;
    totalCustomers: number;
    totalConstructions: number;
    recentReports: number;
}

export const useAnalytics = (userId?: string) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AnalyticsStats>({
        pass: 0,
        fail: 0,
        avgWater: 0,
        avgAir: 0,
        totalReports: 0,
        totalCustomers: 0,
        totalConstructions: 0,
        recentReports: 0
    });

    useEffect(() => {
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

                let pass = 0, fail = 0;
                let waterDuration = 0, waterCount = 0;
                let airDuration = 0, airCount = 0;
                const totalReports = forms?.length || 0;

                // Calculate date 7 days ago
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                let recentReports = 0;

                const parseDurationMinutes = (val?: string | null) => {
                    if (!val) return 0;
                    const parts = val.split(':').map(Number);
                    if (parts.length >= 2) {
                        const [h, m, s = 0] = parts;
                        return h * 60 + m + s / 60;
                    }
                    return 0;
                };

                forms?.forEach((f) => {
                    if (f.satisfies) pass += 1; else fail += 1;
                    const minutes = parseDurationMinutes(f.examination_duration);
                    if (f.type_id === 1) {
                        waterDuration += minutes;
                        waterCount += 1;
                    } else if (f.type_id === 2) {
                        airDuration += minutes;
                        airCount += 1;
                    }

                    // Count recent reports
                    if (f.created_at && new Date(f.created_at) >= sevenDaysAgo) {
                        recentReports += 1;
                    }
                });

                // Fetch customers count (Global only, or maybe filtered if we had user-customer relation, but for now global is fine or 0 for personal)
                // For personal analytics, maybe we don't show total customers/constructions if they are global entities?
                // Let's keep them global for the main dashboard, but for personal profile maybe we just skip them or show 0?
                // Actually, the user request is "personal analytics", so maybe just reports stats are relevant.
                // But to keep interface consistent, we can fetch them.
                // However, if userId is present, maybe we only care about reports.

                let customersCount = 0;
                let constructionsCount = 0;

                if (!userId) {
                    // Only fetch global counts if no userId filter (or if we want to show global counts on profile too? probably not)
                    const { count: custCount, error: customersError } = await supabase
                        .from('customers')
                        .select('*', { count: 'exact', head: true });
                    if (customersError) throw customersError;
                    customersCount = custCount || 0;

                    const { count: constCount, error: constructionsError } = await supabase
                        .from('constructions')
                        .select('*', { count: 'exact', head: true });
                    if (constructionsError) throw constructionsError;
                    constructionsCount = constCount || 0;
                } else {
                    // For personal analytics, we could try to count customers/constructions associated with user's reports?
                    // That's complex. Let's just leave them as 0 or handle in UI.
                    // Actually, let's just return 0 for now as the main focus is performance (pass/fail/duration).
                }

                setStats({
                    pass,
                    fail,
                    avgWater: waterCount ? +(waterDuration / waterCount).toFixed(1) : 0,
                    avgAir: airCount ? +(airDuration / airCount).toFixed(1) : 0,
                    totalReports,
                    totalCustomers: customersCount,
                    totalConstructions: constructionsCount,
                    recentReports
                });
            } catch (err: unknown) {
                console.error('Failed to load analytics', err);
                setError(t('analytics.error'));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userId, t]);

    return { stats, loading, error };
};
