import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), single: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({
    supabase: { from: () => ({ insert: mocks.insert, update: mocks.update }) },
}));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));

import { customerService } from '../src/services/customerService';
import { isNetworkError } from '../src/lib/errorHandler';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.single.mockResolvedValue({ data: { id: 'customer-1', name: 'Customer' }, error: null });
    mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }) });
    mocks.update.mockReturnValue({ eq: () => ({ select: () => ({ single: mocks.single }) }) });
});

describe('customer database payloads and offline fallback', () => {
    const cachedCustomer = {
        id: 'customer-1', name: 'Customer', address: '', postal_code: '10000',
        _synced: true, _is_offline: true, last_activity_date: '2026-01-01',
        created_at: '2026-01-01', updated_at: '2026-01-01',
    };

    it('writes editable columns without cache metadata, timestamps or computed list fields', async () => {
        await customerService.create(cachedCustomer);
        await customerService.update(cachedCustomer.id, cachedCustomer);
        const expected = { name: 'Customer', address: '', postal_code: '10000' };
        expect(mocks.insert).toHaveBeenCalledWith([expected]);
        expect(mocks.update).toHaveBeenCalledWith(expected);
    });

    it('preserves serialized transport failures for the offline queue', async () => {
        const error = { code: '', message: 'TypeError: Failed to fetch', details: 'fetch rejected', hint: '' };
        mocks.single.mockResolvedValue({ data: null, error });
        const received = await customerService.create({ name: 'Customer' }).catch(error => error);
        expect(received).toBe(error);
        expect(isNetworkError(received)).toBe(true);
    });

    it('does not turn a database permission denial into an offline write', async () => {
        mocks.single.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } });
        const error = await customerService.update('customer-1', { name: 'Customer' }).catch(error => error);
        expect(isNetworkError(error)).toBe(false);
    });
});
