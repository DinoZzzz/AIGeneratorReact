import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, HardHat, FileText, Activity, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface DashboardReport {
    id: string;
    examination_date: string;
    type_id: number;
    satisfies: boolean;
    constructions: {
        name: string;
        work_order: string;
        customers: {
            name: string;
        };
    };
}

export const Dashboard = () => {
    const [stats, setStats] = useState({
        customers: 0,
        constructions: 0,
        reports: 0
    });
    const [recentReports, setRecentReports] = useState<DashboardReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Fetch counts
            const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: constructionsCount } = await supabase.from('constructions').select('*', { count: 'exact', head: true });
            const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });

            setStats({
                customers: customersCount || 0,
                constructions: constructionsCount || 0,
                reports: reportsCount || 0
            });

            // Fetch recent reports
            const { data: reports } = await supabase
                .from('reports')
                .select(`
                    id,
                    examination_date,
                    type_id,
                    satisfies,
                    constructions (
                        name,
                        work_order,
                        customers (
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (reports) {
                setRecentReports(reports as unknown as DashboardReport[]);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your testing activities.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Customers"
                    value={stats.customers}
                    icon={Users}
                    href="/customers"
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <StatsCard
                    title="Active Sites"
                    value={stats.constructions}
                    icon={HardHat}
                    href="/constructions"
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
                <StatsCard
                    title="Total Reports"
                    value={stats.reports}
                    icon={FileText}
                    href="/reports"
                    color="text-emerald-600"
                    bgColor="bg-emerald-100"
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                        Recent Reports
                    </h3>
                    <Link to="/reports" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
                        View all <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>
                <ul className="divide-y divide-border">
                    {recentReports.map((report) => (
                        <li key={report.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-primary truncate">
                                            {report.type_id === 1 ? 'Water Test' : 'Air Test'}
                                        </p>
                                        <span className="mx-2 text-muted-foreground">•</span>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {report.constructions?.name} ({report.constructions?.work_order})
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                        <Users className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                                        {report.constructions?.customers?.name}
                                        <span className="mx-2">•</span>
                                        {new Date(report.examination_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className={cn(
                                        "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full",
                                        report.satisfies
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    )}>
                                        {report.satisfies ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {recentReports.length === 0 && (
                        <li className="px-6 py-8 text-center text-muted-foreground">
                            No recent reports found.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    href: string;
    color: string;
    bgColor: string;
}

const StatsCard = ({ title, value, icon: Icon, href, color, bgColor }: StatsCardProps) => {
    return (
        <Link to={href} className="group block bg-card overflow-hidden shadow-sm rounded-xl border border-border hover:shadow-md transition-all duration-200">
            <div className="p-6">
                <div className="flex items-center">
                    <div className={cn("flex-shrink-0 p-3 rounded-lg", bgColor)}>
                        <Icon className={cn("h-6 w-6", color)} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
                            <dd>
                                <div className="text-2xl font-bold text-foreground">{value}</div>
                            </dd>
                        </dl>
                    </div>
                    <div className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
