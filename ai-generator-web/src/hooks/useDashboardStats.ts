import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface StatItem {
    name: string;
    count: number;
    id: string;
    [key: string]: string | number;
}

interface ExaminerStat {
    id: string;
    name: string;
    todayCount: number;
    weekCount: number;
}

interface ReportCustomerRow {
    construction: {
        customer: {
            id: string;
            name: string;
        } | null;
    } | null;
}

interface ReportExaminerRow {
    user_id: string | null;
    created_at: string;
}

export interface DashboardStatsData {
    customerStats: StatItem[];
    examinerStats: ExaminerStat[];
}

interface CustomerStatRpcRow {
    id: string;
    name: string;
    count: number | string;
}

/**
 * Top customers by all-time report count. Prefers the server-side aggregate
 * (get_dashboard_customer_stats migration); falls back to aggregating the
 * rows client-side when the RPC isn't deployed yet.
 */
async function fetchCustomerStats(): Promise<StatItem[]> {
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_dashboard_customer_stats', { p_limit: 3 });

    if (!rpcError && rpcData) {
        return (rpcData as CustomerStatRpcRow[]).map((row) => ({
            id: row.id,
            name: row.name,
            count: Number(row.count),
        }));
    }

    const { data: customerRows, error } = await supabase
        .from('report_forms')
        .select(`
            construction:constructions (
                customer:customers (
                    id,
                    name
                )
            )
        `);

    if (error) throw error;
    if (!customerRows) return [];

    const customerCounts: Record<string, { name: string, count: number }> = {};

    (customerRows as unknown as ReportCustomerRow[]).forEach((report) => {
        const customer = report.construction?.customer;
        if (customer) {
            if (!customerCounts[customer.id]) {
                customerCounts[customer.id] = { name: customer.name, count: 0 };
            }
            customerCounts[customer.id].count++;
        }
    });

    return Object.entries(customerCounts)
        .map(([id, val]) => ({ id, name: val.name, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
}

async function fetchDashboardStats(): Promise<DashboardStatsData> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Examiner stats only need the last 7 days of rows.
    const [customerStats, examinerRowsResult, profilesResult] = await Promise.all([
        fetchCustomerStats(),
        supabase
            .from('report_forms')
            .select('user_id, created_at')
            .gte('created_at', weekAgo.toISOString()),
        supabase
            .from('profiles')
            .select('id, name, last_name, email, role')
    ]);

    if (examinerRowsResult.error) throw examinerRowsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const examinerRows = examinerRowsResult.data;
    const allProfiles = profilesResult.data;

    if (!examinerRows || !allProfiles) {
        return { customerStats, examinerStats: [] };
    }

    // Process Examiner Stats
    const examinerCounts: Record<string, { todayCount: number, weekCount: number }> = {};

    allProfiles.forEach((profile) => {
        examinerCounts[profile.id] = { todayCount: 0, weekCount: 0 };
    });

    (examinerRows as ReportExaminerRow[]).forEach((report) => {
        if (report.user_id && examinerCounts[report.user_id]) {
            const reportDate = new Date(report.created_at);
            if (reportDate >= today) {
                examinerCounts[report.user_id].todayCount++;
            }
            examinerCounts[report.user_id].weekCount++;
        }
    });

    const profileMap = new Map(allProfiles.map(p => [p.id, p]));

    const examinerStats = Object.entries(examinerCounts)
        .map(([id, counts]) => {
            const profile = profileMap.get(id);
            const name = profile
                ? `${profile.name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
                : 'Unknown Examiner';
            return { id, name, todayCount: counts.todayCount, weekCount: counts.weekCount };
        })
        .sort((a, b) => b.weekCount - a.weekCount)
        .slice(0, 4);

    return { customerStats, examinerStats };
}

export const dashboardStatsKeys = {
    all: ['dashboardStats'] as const,
};

export const useDashboardStats = () => {
    return useQuery<DashboardStatsData>({
        queryKey: dashboardStatsKeys.all,
        queryFn: fetchDashboardStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
