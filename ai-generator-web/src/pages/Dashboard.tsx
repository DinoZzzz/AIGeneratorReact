import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, HardHat, FileText, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { DashboardCustomersTable } from '../components/dashboard/DashboardCustomersTable';

export const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        customers: 0,
        constructions: 0,
        reports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Fetch counts
            const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: constructionsCount } = await supabase.from('constructions').select('*', { count: 'exact', head: true });
            const { count: reportsCount } = await supabase.from('report_forms').select('*', { count: 'exact', head: true });

            setStats({
                customers: customersCount || 0,
                constructions: constructionsCount || 0,
                reports: reportsCount || 0
            });


        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = () => {
        if (!user) return 'Korisnik';
        return user.user_metadata?.name || user.email?.split('@')[0] || 'Korisnik';
    };

    if (loading) {
        return <div className="flex justify-center p-8">Loading...</div>;
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Pozdrav, {getUserName()}</h1>
                    <p className="text-lg text-muted-foreground mt-1">Vaš generator je spreman.</p>
                </div>
            </div>

            {/* Stats Grid (Summary Cards) */}
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

            {/* Charts & Stats Row */}
            <DashboardStats />

            {/* Main Content: Customers Table */}
            <DashboardCustomersTable />
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
        <Link to={href} className="group block bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-xl border border-border hover:shadow-md transition-all duration-200">
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
