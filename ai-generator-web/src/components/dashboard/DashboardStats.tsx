import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';

interface StatItem {
    name: string;
    count: number;
    id: string;
    [key: string]: string | number; // Add index signature for Recharts compatibility
}

export const DashboardStats = () => {
    const [customerStats, setCustomerStats] = useState<StatItem[]>([]);
    const [examinerStats, setExaminerStats] = useState<StatItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: reports, error } = await supabase
                .from('report_forms')
                .select(`
                    id,
                    user_id,
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
            const examinerCounts: Record<string, number> = {};
            reports.forEach((report: any) => {
                if (report.user_id) {
                    examinerCounts[report.user_id] = (examinerCounts[report.user_id] || 0) + 1;
                }
            });

            const sortedExaminers = Object.entries(examinerCounts)
                .map(([id, count]) => ({ id, name: 'Unknown Examiner', count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            setCustomerStats(sortedCustomers);
            setExaminerStats(sortedExaminers);

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#23b14d', '#f29f05', '#d3efdb'];

    if (loading) return <div>Loading stats...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers Pie Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <h3 className="text-lg font-bold mb-4 w-full text-left">Naručitelji</h3>

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

                <div className="w-full mt-2 space-y-1">
                    {customerStats.map((stat, index) => {
                        const total = customerStats.reduce((acc, curr) => acc + curr.count, 0);
                        const percent = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                        return (
                            <div key={stat.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{stat.name} ({percent}%)</span>
                                </div>
                                <span className="font-semibold">{stat.count}</span>
                            </div>
                        );
                    })}
                </div>
                <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-right">
                    Pregledaj sve
                </button>
            </div>

            {/* Examiners List */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Ispitivači</h3>
                <div className="space-y-4">
                    {examinerStats.map((stat) => (
                        <div key={stat.id} className="flex flex-col">
                            <span className="font-semibold text-base">{stat.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Kreirao {stat.count} izvještaj{stat.count === 1 ? '' : 'a'}
                            </span>
                        </div>
                    ))}
                </div>
                <button className="mt-auto pt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-right">
                    Pregledaj sve
                </button>
            </div>
        </div>
    );
};
