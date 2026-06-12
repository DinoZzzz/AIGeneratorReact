import { supabase } from '../lib/supabase';
import type { Construction } from '../types';
import { execQuery } from '../lib/serviceHelpers';

const SERVICE = 'constructionService';

export const constructionService = {
    async getByCustomerId(customerId: string, includeArchived: boolean = false) {
        let query = supabase
            .from('constructions')
            .select('id, name, work_order, location, customer_id, is_active, is_archived, created_at, updated_at')
            .eq('customer_id', customerId);

        if (!includeArchived) {
            query = query.eq('is_archived', false);
        }

        const data = await execQuery(
            { service: SERVICE, method: 'getByCustomerId', customerId },
            () => query.order('created_at', { ascending: false })
        );
        return data as Construction[];
    },

    async getById(id: string) {
        const data = await execQuery(
            { service: SERVICE, method: 'getById', id },
            () =>
                supabase
                    .from('constructions')
                    .select('*')
                    .eq('id', id)
                    .single(),
            { notFoundEntity: 'Construction' }
        );
        return data as Construction;
    },

    async create(construction: Partial<Construction>) {
        const data = await execQuery({ service: SERVICE, method: 'create' }, () =>
            supabase
                .from('constructions')
                .insert([construction])
                .select()
                .single()
        );
        return data as Construction;
    },

    async update(id: string, construction: Partial<Construction>) {
        const data = await execQuery({ service: SERVICE, method: 'update', id }, () =>
            supabase
                .from('constructions')
                .update(construction)
                .eq('id', id)
                .select()
                .single()
        );
        return data as Construction;
    },

    async delete(id: string) {
        // Delete dependent records first to avoid FK violations.
        // NOTE: This is intentionally ordered by dependency depth.
        const exportsData = await execQuery(
            { service: SERVICE, method: 'delete', step: 'selectReportExports', id },
            () =>
                supabase
                    .from('report_exports')
                    .select('id')
                    .eq('construction_id', id)
        );

        const exportIds = (exportsData || [])
            .map((row) => row.id)
            .filter((value): value is string => typeof value === 'string' && value.length > 0);

        if (exportIds.length > 0) {
            await execQuery(
                { service: SERVICE, method: 'delete', step: 'deleteReportExportForms', id, exportCount: exportIds.length },
                () =>
                    supabase
                        .from('report_export_forms')
                        .delete()
                        .in('export_id', exportIds)
            );
        }

        await execQuery(
            { service: SERVICE, method: 'delete', step: 'deleteReportExports', id },
            () =>
                supabase
                    .from('report_exports')
                    .delete()
                    .eq('construction_id', id)
        );

        await execQuery(
            { service: SERVICE, method: 'delete', step: 'deleteReportFiles', id },
            () =>
                supabase
                    .from('report_files')
                    .delete()
                    .eq('construction_id', id)
        );

        await execQuery(
            { service: SERVICE, method: 'delete', step: 'deleteReportForms', id },
            () =>
                supabase
                    .from('report_forms')
                    .delete()
                    .eq('construction_id', id)
        );

        await execQuery(
            { service: SERVICE, method: 'delete', step: 'deleteAppointments', id },
            () =>
                supabase
                    .from('calendar_events')
                    .delete()
                    .eq('construction_id', id)
        );

        await execQuery(
            { service: SERVICE, method: 'delete', step: 'deleteConstruction', id },
            () =>
                supabase
                    .from('constructions')
                    .delete()
                    .eq('id', id)
        );
    },

    async checkWorkOrderExists(workOrder: string, customerId: string, excludeId?: string) {
        let query = supabase
            .from('constructions')
            .select('id')
            .eq('work_order', workOrder)
            .eq('customer_id', customerId);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const data = await execQuery(
            { service: SERVICE, method: 'checkWorkOrderExists', workOrder, customerId },
            () => query
        );
        return data.length > 0;
    },

    async archive(id: string) {
        const data = await execQuery({ service: SERVICE, method: 'archive', id }, () =>
            supabase
                .from('constructions')
                .update({ is_archived: true })
                .eq('id', id)
                .select()
                .single()
        );
        return data as Construction;
    },

    async unarchive(id: string) {
        const data = await execQuery({ service: SERVICE, method: 'unarchive', id }, () =>
            supabase
                .from('constructions')
                .update({ is_archived: false })
                .eq('id', id)
                .select()
                .single()
        );
        return data as Construction;
    }
};
