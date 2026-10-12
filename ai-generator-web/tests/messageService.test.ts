import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), getUser: vi.fn(), from: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));

import { messageService } from '../src/services/messageService';
import { isNetworkError } from '../src/lib/errorHandler';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'current-user' } }, error: null });
    mocks.from.mockReturnValue({
        select: () => ({ order: () => ({ limit: mocks.execute }) }),
        insert: () => ({ select: () => ({ single: mocks.execute }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: mocks.execute }) }) }),
        delete: () => ({ eq: mocks.execute }),
    });
});

describe('chat network error handling', () => {
    const operations = [
        () => messageService.getMessages(),
        () => messageService.sendMessage('message'),
        () => messageService.updateMessage('id', 'updated'),
        () => messageService.deleteMessage('id'),
    ];

    it.each(operations)('preserves PostgREST fetch failures for offline fallback (%#)', async operation => {
        const error = { code: '', message: 'TypeError: Failed to fetch', details: 'fetch failed', hint: '' };
        mocks.execute.mockResolvedValue({ data: null, error });
        const received = await operation().catch(error => error);
        expect(received).toBe(error);
        expect(isNetworkError(received)).toBe(true);
    });

    it('does not queue an authorization rejection as a network failure', async () => {
        mocks.execute.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } });
        const error = await messageService.sendMessage('message').catch(error => error);
        expect(error.message).toBe('permission denied');
        expect(isNetworkError(error)).toBe(false);
    });

    it('treats a failed auth network check as offline without inserting an anonymous message', async () => {
        mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 } });
        const error = await messageService.sendMessage('message').catch(error => error);
        expect(isNetworkError(error)).toBe(true);
        expect(mocks.from).not.toHaveBeenCalled();
    });

    it('rejects an expired account instead of inserting without an author', async () => {
        const authError = { name: 'AuthApiError', message: 'Invalid JWT', status: 401 };
        mocks.getUser.mockResolvedValue({ data: { user: null }, error: authError });
        await expect(messageService.sendMessage('message')).rejects.toBe(authError);
        expect(mocks.from).not.toHaveBeenCalled();
    });
});
