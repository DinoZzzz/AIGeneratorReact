import { supabase } from '../lib/supabase';
import type { ReportForm } from '../types';
import { execQuery, execQueryRaw } from '../lib/serviceHelpers';

const SERVICE = 'reportService';

const LIST_SELECT = `
            *,
            construction:constructions(name, work_order),
            draft:report_drafts(name)
          `;

export const reportService = {
    async getAll() {
        const data = await execQuery({ service: SERVICE, method: 'getAll' }, () =>
            supabase
                .from('report_forms')
                .select(LIST_SELECT)
                .order('created_at', { ascending: false })
        );
        return data as ReportForm[];
    },

    async getPaginated(page: number = 1, pageSize: number = 15) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count } = await execQueryRaw(
            { service: SERVICE, method: 'getPaginated', page, pageSize },
            () =>
                supabase
                    .from('report_forms')
                    .select(LIST_SELECT, { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to)
        );
        return { data: data as ReportForm[], count: count || 0 };
    },

    async getByConstruction(constructionId: string) {
        const data = await execQuery(
            { service: SERVICE, method: 'getByConstruction', constructionId },
            () =>
                supabase
                    .from('report_forms')
                    .select(LIST_SELECT)
                    .eq('construction_id', constructionId)
                    .order('ordinal', { ascending: true })
        );
        return data as ReportForm[];
    },

    async getById(id: string) {
        const data = await execQuery(
            { service: SERVICE, method: 'getById', id },
            () =>
                supabase
                    .from('report_forms')
                    .select('*')
                    .eq('id', id)
                    .single(),
            { notFoundEntity: 'Report' }
        );
        return data as ReportForm;
    },

    async create(report: Partial<ReportForm>) {
        const { data: { user } } = await supabase.auth.getUser();

        const reportWithUser = {
            ...report,
            user_id: user?.id || null
        };

        const data = await execQuery({ service: SERVICE, method: 'create' }, () =>
            supabase
                .from('report_forms')
                .insert(reportWithUser)
                .select()
                .single()
        );
        return data as ReportForm;
    },

    async update(id: string, report: Partial<ReportForm>) {
        const data = await execQuery({ service: SERVICE, method: 'update', id }, () =>
            supabase
                .from('report_forms')
                .update(report)
                .eq('id', id)
                .select()
                .single()
        );
        return data as ReportForm;
    },

    async delete(id: string) {
        await execQuery({ service: SERVICE, method: 'delete', id }, () =>
            supabase
                .from('report_forms')
                .delete()
                .eq('id', id)
        );
    },

    async updateOrder(reports: ReportForm[]) {
        const updates = reports.map((report, index) => ({
            id: report.id,
            ordinal: index
        }));

        await execQuery({ service: SERVICE, method: 'updateOrder' }, () =>
            supabase
                .from('report_forms')
                .upsert(updates, { onConflict: 'id', ignoreDuplicates: false })
        );
    },

    async getLastByConstructionAndType(constructionId: string, typeId: number, customerId?: string) {
        const data = await execQuery(
            { service: SERVICE, method: 'getLastByConstructionAndType', constructionId, typeId, customerId },
            () => {
                let query = supabase
                    .from('report_forms')
                    .select('*')
                    .eq('construction_id', constructionId)
                    .eq('type_id', typeId);

                if (customerId) {
                    query = query.eq('customer_id', customerId);
                }

                return query
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
            }
        );
        return data as ReportForm | null;
    },

    async getLastByConstruction(constructionId: string, customerId?: string) {
        const data = await execQuery(
            { service: SERVICE, method: 'getLastByConstruction', constructionId, customerId },
            () => {
                let query = supabase
                    .from('report_forms')
                    .select('*')
                    .eq('construction_id', constructionId);

                if (customerId) {
                    query = query.eq('customer_id', customerId);
                }

                return query
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
            }
        );
        return data as ReportForm | null;
    }
};
