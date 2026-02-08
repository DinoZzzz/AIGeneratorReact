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

interface ReportWithConstruction {
    id: string;
    user_id: string;
    created_at: string;
    construction: {
        id: string;
        customer: {
            id: string;
            name: string;
        } | null;
    } | null;
}

export interface DashboardStatsData {
    customerStats: StatItem[];
    examinerStats: ExaminerStat[];
}

async function fetchDashboardStats(): Promise<DashboardStatsData> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [reportsResult, profilesResult] = await Promise.all([
        supabase
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
            `),
        supabase
            .from('profiles')
            .select('id, name, last_name, email, role')
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const reports = reportsResult.data;
    const allProfiles = profilesResult.data;

    if (!reports || !allProfiles) {
        return { customerStats: [], examinerStats: [] };
    }

    // Process Customer Stats
    const customerCounts: Record<string, { name: string, count: number }> = {};

    (reports as ReportWithConstruction[]).forEach((report) => {
        const customer = report.construction?.customer;
        if (customer) {
            if (!customerCounts[customer.id]) {
                customerCounts[customer.id] = { name: customer.name, count: 0 };
            }
            customerCounts[customer.id].count++;
        }
    });

    const customerStats = Object.entries(customerCounts)
        .map(([id, val]) => ({ id, name: val.name, count: val.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // Process Examiner Stats
    const examinerCounts: Record<string, { todayCount: number, weekCount: number }> = {};

    allProfiles.forEach((profile) => {
        examinerCounts[profile.id] = { todayCount: 0, weekCount: 0 };
    });

    (reports as ReportWithConstruction[]).forEach((report) => {
        if (report.user_id && examinerCounts[report.user_id]) {
            const reportDate = new Date(report.created_at);
            if (reportDate >= today) {
                examinerCounts[report.user_id].todayCount++;
            }
            if (reportDate >= weekAgo) {
                examinerCounts[report.user_id].weekCount++;
            }
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
