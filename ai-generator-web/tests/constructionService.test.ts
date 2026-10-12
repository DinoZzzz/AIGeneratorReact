import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Construction } from '../src/types';

const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: vi.fn(() => ({
    insert: mocks.insert,
    update: mocks.update,
})) } }));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));
import { constructionService } from '../src/services/constructionService';

beforeEach(() => {
    vi.clearAllMocks();
    const result = { select: () => ({ single: async () => ({ data: { id: 'construction-1' }, error: null }) }) };
    mocks.insert.mockReturnValue(result);
    mocks.update.mockReturnValue({ eq: () => result });
});

describe('construction writes from cached form records', () => {
    it.each(['create', 'update'] as const)('excludes cache metadata and joined records during %s', async method => {
        const cached = {
            id: 'construction-1', customer_id: 'customer-1', name: 'Site', work_order: 'RN-1', location: 'Zagreb',
            is_active: true, is_archived: false, created_at: '2026-01-01',
            customer: { id: 'customer-1', name: 'Customer' }, _synced: true, _is_offline: true,
        } as unknown as Construction;
        if (method === 'create') await constructionService.create(cached);
        else await constructionService.update(cached.id, cached);
        const payload = { customer_id: 'customer-1', name: 'Site', work_order: 'RN-1', location: 'Zagreb', is_active: true, is_archived: false };
        expect(method === 'create' ? mocks.insert : mocks.update).toHaveBeenCalledWith(method === 'create' ? [payload] : payload);
    });
});
