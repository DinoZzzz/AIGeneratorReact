import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, HardHat, FileText, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { DashboardCustomersTable } from '../components/dashboard/DashboardCustomersTable';

export const Dashboard = () => {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
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
        if (profile?.name) {
            return profile.last_name ? `${profile.name} ${profile.last_name}` : profile.name;
        }
        return user.email?.split('@')[0] || 'Korisnik';
    };

    if (loading) {
        return <div className="flex justify-center p-8">{t('dashboard.loading')}</div>;
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('dashboard.welcome')}, {getUserName()}</h1>
                    <p className="text-muted-foreground mt-1">
                        {new Date().toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid (Summary Cards) */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title={t('dashboard.totalCustomers')}
                    value={stats.customers}
                    icon={Users}
                    href="/customers"
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <StatsCard
                    title={t('dashboard.activeSites')}
                    value={stats.constructions}
                    icon={HardHat}
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
                <StatsCard
                    title={t('dashboard.totalReports')}
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
    href?: string;
    color: string;
    bgColor: string;
}

const StatsCard = ({ title, value, icon: Icon, href, color, bgColor }: StatsCardProps) => {
    const content = (
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
                {href && (
                    <div className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link to={href} className="group block bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-xl border border-border hover:shadow-md transition-all duration-200">
                {content}
            </Link>
        );
    }

    return (
        <div className="block bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-xl border border-border">
            {content}
        </div>
    );
};
