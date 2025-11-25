import { ArrowLeft, PieChart, Activity, Loader2, FileText, Users, Building2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAnalytics } from '../hooks/useAnalytics';

export const Analytics = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { stats, loading, error } = useAnalytics();

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
                    {/* Top stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-card border border-border rounded-xl shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('analytics.totalReports')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-2">{stats.totalReports}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('analytics.activeCustomers')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-2">{stats.totalCustomers}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('analytics.constructionSites')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-2">{stats.totalConstructions}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('analytics.recentActivity')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-2">{stats.recentReports}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('analytics.thisWeek')}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts section */}
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
