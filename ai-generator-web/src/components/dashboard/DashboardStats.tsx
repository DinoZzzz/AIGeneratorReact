import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface StatItem {
    name: string;
    count: number;
    id: string;
    [key: string]: string | number; // Add index signature for Recharts compatibility
}

interface ExaminerStat {
    id: string;
    name: string;
    todayCount: number;
    weekCount: number;
}

export const DashboardStats = () => {
    const [customerStats, setCustomerStats] = useState<StatItem[]>([]);
    const [examinerStats, setExaminerStats] = useState<ExaminerStat[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Get date ranges
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: reports, error } = await supabase
                .from('report_forms')
                .select(`
                    id,
                    user_id,
                    created_at,
                    construction:constructions (
                        id,
                        customer:customers (
                            id,
                            name
                        )
                    )
                `);

            if (error) throw error;

            if (!reports) return;

            // 1. Process Customer Stats
            const customerCounts: Record<string, { name: string, count: number }> = {};

            reports.forEach((report: any) => {
                const customer = report.construction?.customer;
                if (customer) {
                    if (!customerCounts[customer.id]) {
                        customerCounts[customer.id] = { name: customer.name, count: 0 };
                    }
                    customerCounts[customer.id].count++;
                }
            });

            const sortedCustomers = Object.entries(customerCounts)
                .map(([id, val]) => ({ id, name: val.name, count: val.count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3); // Top 3

            // 2. Process Examiner Stats
            // First, fetch all profiles
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, name, last_name, email, role');

            if (!allProfiles) return;

            const examinerCounts: Record<string, { todayCount: number, weekCount: number }> = {};

            // Initialize all users with 0 counts
            allProfiles.forEach((profile) => {
                examinerCounts[profile.id] = { todayCount: 0, weekCount: 0 };
            });

            // Count reports for each user
            reports.forEach((report: any) => {
                if (report.user_id && examinerCounts[report.user_id]) {
                    const reportDate = new Date(report.created_at);

                    // Count reports created today
                    if (reportDate >= today) {
                        examinerCounts[report.user_id].todayCount++;
                    }

                    // Count reports created this week
                    if (reportDate >= weekAgo) {
                        examinerCounts[report.user_id].weekCount++;
                    }
                }
            });

            const profileMap = new Map(allProfiles.map(p => [p.id, p]));

            const sortedExaminers = Object.entries(examinerCounts)
                .map(([id, counts]) => {
                    const profile = profileMap.get(id);
                    const name = profile
                        ? `${profile.name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
                        : 'Unknown Examiner';

                    return {
                        id,
                        name,
                        todayCount: counts.todayCount,
                        weekCount: counts.weekCount
                    };
                })
                .sort((a, b) => b.weekCount - a.weekCount)
                .slice(0, 4); // Top 4 examiners

            setCustomerStats(sortedCustomers);
            setExaminerStats(sortedExaminers);

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#23b14d', '#f29f05', '#d3efdb'];

    if (loading) return <div>{t('dashboard.loading')}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers Pie Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <h3 className="text-lg font-bold mb-4 w-full text-left">{t('dashboard.topCustomers')}</h3>

                {/* Chart Container with Fixed Min Height */}
                <div className="w-full h-64 min-h-[256px] relative">
                    <ResponsiveContainer width="100%" height="100%">
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
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-4">{t('dashboard.examiners')}</h3>
                <div className="space-y-4">
                    {examinerStats.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.noCustomers')}</p>
                    ) : (
                        examinerStats.map((stat) => (
                            <div key={stat.id} className="flex flex-col space-y-1">
                                <span className="font-semibold text-base">{stat.name}</span>
                                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                                    <span>
                                        {t('dashboard.today')}: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stat.todayCount}</span>
                                    </span>
                                    <span>
                                        {t('dashboard.thisWeek')}: <span className="font-semibold text-blue-600 dark:text-blue-400">{stat.weekCount}</span>
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
