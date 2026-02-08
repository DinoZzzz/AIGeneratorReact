import {
    ArrowLeft,
    Loader2,
    FileText,
    Users,
    Building2,
    TrendingUp,
    Clock3,
    Gauge,
    CalendarDays,
    FlaskConical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAnalytics } from '../hooks/useAnalytics';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from 'recharts';

export const Analytics = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { stats, dailyTrend, methodMix, durationBuckets, weekdayActivity, loading, error } = useAnalytics();

    const noData = stats.totalReports === 0;
    const passRate = Math.round(stats.passRate);
    const momentumPositive = stats.weeklyMomentum >= 0;

    const outcomeData = [
        { name: t('analytics.pass'), value: stats.pass, color: '#16a34a' },
        { name: t('analytics.fail'), value: stats.fail, color: '#ef4444' },
    ];

    const methodMixData = methodMix.map((item) => ({
        ...item,
        name: item.type === 'water' ? t('analytics.water') : t('analytics.air'),
        color: item.type === 'water' ? '#0ea5e9' : '#22c55e',
    }));

    const durationBucketsData = durationBuckets.map((item) => ({
        ...item,
        label: {
            under15: t('analytics.durationUnder15'),
            '15to30': t('analytics.duration15to30'),
            '30to60': t('analytics.duration30to60'),
            over60: t('analytics.durationOver60'),
        }[item.bucket],
    }));

    const weekdayData = weekdayActivity.map((item) => ({
        ...item,
        label: {
            sun: t('analytics.weekday.sun'),
            mon: t('analytics.weekday.mon'),
            tue: t('analytics.weekday.tue'),
            wed: t('analytics.weekday.wed'),
            thu: t('analytics.weekday.thu'),
            fri: t('analytics.weekday.fri'),
            sat: t('analytics.weekday.sat'),
        }[item.day],
    }));

    const ringRadius = 52;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringProgress = (passRate / 100) * ringCircumference;

    const tooltipStyle = {
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
        borderRadius: '12px',
    };

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
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6">
                        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            <div className="space-y-4">
                                <p className="text-sm font-medium uppercase tracking-wide text-primary">{t('analytics.kpiSnapshot')}</p>
                                <h2 className="text-3xl font-semibold text-foreground">{t('analytics.importantMetrics')}</h2>
                                <p className="text-muted-foreground max-w-xl">{t('analytics.subtitle')}</p>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="px-3 py-2 rounded-lg bg-card/80 border border-border text-sm">
                                        <span className="text-muted-foreground">{t('analytics.passRate')}:</span>{' '}
                                        <span className="font-semibold text-foreground">{passRate}%</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-lg border text-sm ${momentumPositive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'}`}>
                                        <span className="font-semibold">
                                            {momentumPositive ? '+' : ''}
                                            {stats.weeklyMomentum}%
                                        </span>{' '}
                                        {t('analytics.weeklyMomentum')}
                                    </div>
                                    <div className="px-3 py-2 rounded-lg bg-card/80 border border-border text-sm">
                                        <span className="text-muted-foreground">{t('analytics.avgDuration')}:</span>{' '}
                                        <span className="font-semibold text-foreground">{stats.avgDuration} min</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative h-40 w-40">
                                    <svg viewBox="0 0 140 140" className="h-40 w-40">
                                        <circle cx="70" cy="70" r={ringRadius} stroke="hsl(var(--muted))" strokeWidth="14" fill="none" />
                                        <circle
                                            cx="70"
                                            cy="70"
                                            r={ringRadius}
                                            stroke="hsl(var(--primary))"
                                            strokeWidth="14"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={ringCircumference}
                                            strokeDashoffset={ringCircumference - ringProgress}
                                            transform="rotate(-90 70 70)"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <p className="text-3xl font-bold text-foreground">{passRate}%</p>
                                        <p className="text-xs text-muted-foreground">{t('analytics.passRate')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {noData ? (
                        <div className="rounded-xl border border-border bg-card p-10 text-center">
                            <h3 className="text-xl font-semibold text-foreground">{t('analytics.emptyTitle')}</h3>
                            <p className="text-muted-foreground mt-2">{t('analytics.emptySubtitle')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.totalReports')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.totalReports}</p>
                                        </div>
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.recentActivity')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.recentReports}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t('analytics.thisWeek')}</p>
                                        </div>
                                        <CalendarDays className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.avgReportsPerDay')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.avgDailyReports}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t('analytics.thisWeek')}</p>
                                        </div>
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.avgDuration')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.avgDuration}m</p>
                                        </div>
                                        <Clock3 className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.activeCustomers')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.totalCustomers}</p>
                                        </div>
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('analytics.constructionSites')}</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{stats.totalConstructions}</p>
                                        </div>
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-foreground">{t('analytics.trend30Days')}</h3>
                                        <span className="text-xs text-muted-foreground">{t('analytics.last30Days')}</span>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dailyTrend}>
                                                <defs>
                                                    <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                                                    </linearGradient>
                                                    <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                                                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} minTickGap={20} />
                                                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend />
                                                <Area type="monotone" dataKey="pass" name={t('analytics.pass')} stroke="#16a34a" fill="url(#passGradient)" />
                                                <Area type="monotone" dataKey="fail" name={t('analytics.fail')} stroke="#ef4444" fill="url(#failGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Gauge className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold text-foreground">{t('analytics.outcomeSplit')}</h3>
                                    </div>
                                    <div className="h-60 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={outcomeData} innerRadius={52} outerRadius={82} dataKey="value" nameKey="name">
                                                    {outcomeData.map((item) => (
                                                        <Cell key={item.name} fill={item.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-3xl font-bold text-foreground">{passRate}%</p>
                                            <p className="text-xs text-muted-foreground">{t('analytics.passRate')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        {outcomeData.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-foreground">{item.name}</span>
                                                </div>
                                                <span className="text-muted-foreground">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FlaskConical className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold text-foreground">{t('analytics.methodMix')}</h3>
                                    </div>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={methodMixData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                    {methodMixData.map((item) => (
                                                        <Cell key={item.type} fill={item.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        {methodMixData.map((item) => (
                                            <div key={item.type} className="flex justify-between text-sm">
                                                <span className="text-foreground">{item.name}</span>
                                                <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics.durationBuckets')}</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={durationBucketsData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                                                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} interval={0} />
                                                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics.activityByWeekday')}</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weekdayData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                                            <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                            <Tooltip contentStyle={tooltipStyle} />
                                            <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
