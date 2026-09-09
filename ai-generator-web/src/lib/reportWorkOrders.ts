import type { Construction, ReportForm } from '../types';
import { STORES, getFromStore } from './offlineDb';
import { supabase } from './supabase';

const getConstructionId = (report: Partial<ReportForm>): string | undefined =>
    report.construction_id || report.construction?.id;

const normalizeWorkOrder = (value?: string): string | undefined =>
    typeof value === 'string' ? value.trim() || undefined : undefined;

const getJoinedWorkOrder = (report: Partial<ReportForm>): string | undefined => {
    const construction = report.construction;
    // A duplicate or edited report may still carry the previous site's join.
    if (report.construction_id && construction?.id && construction.id !== report.construction_id) {
        return undefined;
    }
    return normalizeWorkOrder(construction?.work_order);
};

/** Resolve each site's work order once for single, bulk, and offline exports. */
export const resolveReportWorkOrders = async (
    reports: Partial<ReportForm>[]
): Promise<Map<string, string>> => {
    const workOrders = new Map<string, string>();
    const ids = new Set<string>();
    for (const report of reports) {
        const id = getConstructionId(report);
        if (!id) continue;
        ids.add(id);
        const joinedWorkOrder = getJoinedWorkOrder(report);
        if (joinedWorkOrder) workOrders.set(id, joinedWorkOrder);
    }

    await Promise.all([...ids].filter((id) => !workOrders.has(id)).map(async (id) => {
        try {
            const cached = await getFromStore<Construction>(STORES.CONSTRUCTIONS, id);
            const workOrder = cached?.id === id ? normalizeWorkOrder(cached.work_order) : undefined;
            if (workOrder) workOrders.set(id, workOrder);
        } catch {
            // IndexedDB may be unavailable; try the server below.
        }
    }));

    // Unsynced construction ids cannot be queried against the server's UUID column.
    const missing = [...ids].filter((id) => !workOrders.has(id) && !id.startsWith('temp_'));
    if (missing.length === 0 || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        return workOrders;
    }

    try {
        const { data, error } = await supabase
            .from('constructions')
            .select('id, work_order')
            .in('id', missing);
        if (error) throw error;
        (data as Pick<Construction, 'id' | 'work_order'>[] | null)?.forEach((construction) => {
            const workOrder = normalizeWorkOrder(construction.work_order);
            if (workOrder) workOrders.set(construction.id, workOrder);
        });
    } catch {
        // A missing header value must not prevent downloading the measurements.
        console.warn('Failed to resolve report construction work orders');
    }

    return workOrders;
};

export const getReportWorkOrder = (
    report: Partial<ReportForm>,
    workOrders: Map<string, string>
): string => {
    const id = getConstructionId(report);
    return (id ? workOrders.get(id) : undefined) || getJoinedWorkOrder(report) || '-';
};

/** The route identifies the destination site when previewing a new or copied form. */
export const withReportConstruction = (
    report: Partial<ReportForm>,
    constructionId?: string
): Partial<ReportForm> => {
    if (!constructionId || constructionId === 'undefined' || constructionId === report.construction_id) {
        return report;
    }
    return { ...report, construction_id: constructionId, construction: undefined };
};
