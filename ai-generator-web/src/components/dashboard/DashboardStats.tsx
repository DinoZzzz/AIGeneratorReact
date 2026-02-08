import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';

const DashboardStatsComponent = () => {
    const { t } = useLanguage();
    const { data, isLoading: loading } = useDashboardStats();

    const customerStats = data?.customerStats ?? [];
    const examinerStats = data?.examinerStats ?? [];

    const COLORS = ['#23b14d', '#f29f05', '#d3efdb'];

    if (loading) return <div>{t('dashboard.loading')}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers Pie Chart */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col items-center">
                <h3 className="text-lg font-bold mb-4 w-full text-left">{t('dashboard.topCustomers')}</h3>

                {/* Chart Container with Fixed Min Height */}
                <div className="w-full h-64 min-h-[256px] relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                        <PieChart>
                            <Pie
                                data={customerStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={0}
                                dataKey="count"
                            >
                                {customerStats.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Examiners List */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-bold">{t('dashboard.examiners')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 font-medium">{t('examiners.fullName')}</th>
                                <th className="px-4 py-3 font-medium text-center">{t('dashboard.today')}</th>
                                <th className="px-4 py-3 font-medium text-center">{t('dashboard.thisWeek')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {examinerStats.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('examiners.noneFound')}
                                    </td>
                                </tr>
                            ) : (
                                examinerStats.map((stat) => (
                                    <tr key={stat.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {stat.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.todayCount > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-muted-foreground bg-muted'}`}>
                                                {stat.todayCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.weekCount > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-muted-foreground bg-muted'}`}>
                                                {stat.weekCount}
                                            </span>
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

// Memoize to prevent unnecessary re-renders when parent updates
export const DashboardStats = memo(DashboardStatsComponent);
DashboardStats.displayName = 'DashboardStats';
