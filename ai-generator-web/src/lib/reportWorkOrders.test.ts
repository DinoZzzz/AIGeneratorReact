import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Construction, ReportForm } from '../types';

const getFromStore = vi.fn();
const inFilter = vi.fn();
const from = vi.fn();

vi.mock('./offlineDb', () => ({
    STORES: { CONSTRUCTIONS: 'constructions' },
    getFromStore: (...args: unknown[]) => getFromStore(...args)
}));
vi.mock('./supabase', () => ({
    supabase: { from: (...args: unknown[]) => from(...args) }
}));

const { resolveReportWorkOrders, getReportWorkOrder, withReportConstruction } = await import('./reportWorkOrders');

const makeConstruction = (overrides: Partial<Construction> = {}): Construction => ({
    id: 'site-1',
    customer_id: 'customer-1',
    work_order: '86-D-2026-S1.1.1',
    name: 'Gradilište',
    is_active: true,
    is_archived: false,
    created_at: '2026-09-09',
    ...overrides,
});

beforeEach(() => {
    vi.restoreAllMocks();
    getFromStore.mockReset().mockResolvedValue(undefined);
    inFilter.mockReset().mockResolvedValue({ data: [], error: null });
    from.mockReset().mockReturnValue({ select: () => ({ in: inFilter }) });
    vi.stubGlobal('navigator', { onLine: true });
});

describe('report construction work orders', () => {
    it('uses the joined construction work order without fetching anything', async () => {
        const report = { construction_id: 'site-1', construction: makeConstruction(), ordinal: 42 };
        const orders = await resolveReportWorkOrders([report]);

        expect(getReportWorkOrder(report, orders)).toBe('86-D-2026-S1.1.1');
        expect(getFromStore).not.toHaveBeenCalled();
        expect(from).not.toHaveBeenCalled();
    });

    it('supports legacy joins with only name and work_order', async () => {
        const report: Partial<ReportForm> = {
            construction_id: 'site-1',
            construction: { name: 'Gradilište', work_order: 'RN-1' } as Construction,
        };

        expect(getReportWorkOrder(report, await resolveReportWorkOrders([report]))).toBe('RN-1');
        expect(from).not.toHaveBeenCalled();
    });

    it('resolves a saved report from the construction cache when offline', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        getFromStore.mockResolvedValue(makeConstruction());
        const report = { construction_id: 'site-1' };

        expect(getReportWorkOrder(report, await resolveReportWorkOrders([report]))).toBe('86-D-2026-S1.1.1');
        expect(getFromStore).toHaveBeenCalledWith('constructions', 'site-1');
        expect(from).not.toHaveBeenCalled();
    });

    it('deduplicates sites and fetches only missing work orders for a mixed bundle', async () => {
        getFromStore.mockImplementation(async (_store: string, id: string) =>
            id === 'site-2' ? makeConstruction({ id, work_order: 'RN-2' }) : undefined);
        inFilter.mockResolvedValue({ data: [{ id: 'site-3', work_order: 'RN-3' }], error: null });
        const reports = [
            { construction_id: 'site-1', construction: makeConstruction({ work_order: 'RN-1' }) },
            { construction_id: 'site-2' },
            { construction_id: 'site-3' },
            { construction_id: 'site-3' },
        ];

        const orders = await resolveReportWorkOrders(reports);

        expect(reports.map((report) => getReportWorkOrder(report, orders))).toEqual(['RN-1', 'RN-2', 'RN-3', 'RN-3']);
        expect(getFromStore).toHaveBeenCalledTimes(2);
        expect(from).toHaveBeenCalledWith('constructions');
        expect(inFilter).toHaveBeenCalledTimes(1);
        expect(inFilter).toHaveBeenCalledWith('id', ['site-3']);
    });

    it('uses construction_id when the joined construction belongs to another site', async () => {
        const report = { construction_id: 'site-2', construction: makeConstruction({ work_order: 'WRONG' }) };
        inFilter.mockResolvedValue({ data: [{ id: 'site-2', work_order: 'RN-2' }], error: null });

        const orders = await resolveReportWorkOrders([report]);

        expect(getReportWorkOrder(report, orders)).toBe('RN-2');
        expect(getReportWorkOrder(report, new Map())).toBe('-');
        expect(inFilter).toHaveBeenCalledWith('id', ['site-2']);
    });

    it('does not substitute the customer order or report ordinal when the site order is missing', async () => {
        const report = {
            ordinal: 42,
            construction: makeConstruction({ work_order: ' ', customer: {
                id: 'customer-1', name: 'Naručitelj', work_order: 'CUSTOMER-ORDER', created_at: '2026-09-09',
            } }),
        };

        expect(getReportWorkOrder(report, await resolveReportWorkOrders([report]))).toBe('-');
    });

    it('keeps missing offline work orders empty without querying the server', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        const reports = [{ construction_id: 'site-1' }, {}];
        const orders = await resolveReportWorkOrders(reports);

        expect(reports.map((report) => getReportWorkOrder(report, orders))).toEqual(['-', '-']);
        expect(from).not.toHaveBeenCalled();
    });

    it('keeps unsynced ids out of server queries without blocking other sites', async () => {
        inFilter.mockResolvedValue({ data: [{ id: 'site-1', work_order: 'RN-1' }], error: null });
        const reports = [{ construction_id: 'temp_new-site' }, { construction_id: 'site-1' }];
        const orders = await resolveReportWorkOrders(reports);

        expect(reports.map((report) => getReportWorkOrder(report, orders))).toEqual(['-', 'RN-1']);
        expect(inFilter).toHaveBeenCalledWith('id', ['site-1']);
    });

    it('continues exporting when IndexedDB and the network are unavailable', async () => {
        getFromStore.mockRejectedValue(new Error('IndexedDB unavailable'));
        inFilter.mockRejectedValue(new Error('Network unavailable'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(resolveReportWorkOrders([{ construction_id: 'site-1' }])).resolves.toEqual(new Map());
    });

    it('continues exporting when the server denies access', async () => {
        inFilter.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(resolveReportWorkOrders([{ construction_id: 'site-1' }])).resolves.toEqual(new Map());
    });
});

describe('form preview construction context', () => {
    it('resolves the route site before a new form has been saved', async () => {
        const form = { type_id: 1, temperature: 16 };
        const preview = withReportConstruction(form, 'site-1');
        getFromStore.mockResolvedValue(makeConstruction());

        expect(getReportWorkOrder(preview, await resolveReportWorkOrders([preview]))).toBe('86-D-2026-S1.1.1');
        expect(form).not.toHaveProperty('construction_id');
    });

    it('removes a duplicate source join when previewing in a different destination site', () => {
        const form = { construction_id: 'site-1', construction: makeConstruction() };
        const preview = withReportConstruction(form, 'site-2');

        expect(preview).toEqual({ construction_id: 'site-2', construction: undefined });
        expect(form.construction?.id).toBe('site-1');
    });

    it('preserves valid joins and existing site context without a usable route id', () => {
        const form = { construction_id: 'site-1', construction: makeConstruction() };

        expect(withReportConstruction(form, 'site-1')).toBe(form);
        expect(withReportConstruction(form)).toBe(form);
        expect(withReportConstruction(form, 'undefined')).toBe(form);
    });
});
