import { useEffect, useState } from 'react';
import { ArrowLeft, PieChart, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

export const Analytics = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{
        pass: number;
        fail: number;
        avgWater: number;
        avgAir: number;
    }>({
        pass: 0,
        fail: 0,
        avgWater: 0,
        avgAir: 0
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const now = new Date();
                // Report forms: pass/fail + durations by type
                const { data: forms, error: formsError } = await supabase
                    .from('report_forms')
                    .select('satisfies, type_id, examination_duration');
                if (formsError) throw formsError;

                let pass = 0, fail = 0;
                let waterDuration = 0, waterCount = 0;
                let airDuration = 0, airCount = 0;

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
                });

                setStats({
                    pass,
                    fail,
                    avgWater: waterCount ? +(waterDuration / waterCount).toFixed(1) : 0,
                    avgAir: airCount ? +(airDuration / airCount).toFixed(1) : 0
                });
            } catch (err: unknown) {
                console.error('Failed to load analytics', err);
                setError(t('analytics.error'));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={t('common.back')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="px-4 py-3 rounded-md border border-destructive text-destructive bg-destructive/10">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> {t('analytics.loading')}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-xl shadow p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">{t('analytics.passFail')}</h2>
                            </div>
                            <div className="relative flex items-center justify-center h-40">
                                <svg viewBox="0 0 36 36" className="h-32 w-32">
                                    <path
                                        className="text-primary/20"
                                        strokeDasharray="100, 100"
                                        d="M18 2.0845
                                           a 15.9155 15.9155 0 0 1 0 31.831
                                           a 15.9155 15.9155 0 0 1 0 -31.831"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                    />
                                    <path
                                        className="text-primary"
                                        strokeDasharray={`${stats.pass ? (stats.pass / Math.max(stats.pass + stats.fail, 1)) * 100 : 0}, 100`}
                                        d="M18 2.0845
                                           a 15.9155 15.9155 0 0 1 0 31.831
                                           a 15.9155 15.9155 0 0 1 0 -31.831"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <p className="text-2xl font-bold text-foreground">
                                        {Math.round(stats.pass ? (stats.pass / Math.max(stats.pass + stats.fail, 1)) * 100 : 0)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">{t('analytics.passRate')}</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground">{t('analytics.pass')}</span>
                                <span className="text-muted-foreground">{stats.pass}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground">{t('analytics.fail')}</span>
                                <span className="text-muted-foreground">{stats.fail}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-xl shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">{t('analytics.avgDuration')}</h2>
                            </div>
                            <div className="space-y-3">
                                {[{ type: t('analytics.water'), minutes: stats.avgWater }, { type: t('analytics.air'), minutes: stats.avgAir }].map(item => (
                                    <div key={item.type}>
                                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                            <span>{item.type}</span>
                                            <span className="text-foreground font-medium">{item.minutes} min</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-2 bg-primary"
                                                style={{ width: `${Math.min((item.minutes / 60) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
