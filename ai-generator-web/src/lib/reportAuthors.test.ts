import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile, ReportForm } from '../types';

const getFromStore = vi.fn();
const inFilter = vi.fn();

vi.mock('./offlineDb', () => ({
    STORES: { EXAMINERS: 'examiners' },
    getFromStore: (...args: unknown[]) => getFromStore(...args)
}));

vi.mock('./supabase', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                in: (...args: unknown[]) => inFilter(...args)
            })
        })
    }
}));

const { resolveReportAuthors, getReportAuthor, formatAuthorName } = await import('./reportAuthors');

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
    id: 'author-1',
    name: 'Ivan',
    last_name: 'Horvat',
    username: 'ihorvat',
    role: 'user',
    accreditations: [],
    ...overrides
});

const makeReport = (overrides: Partial<ReportForm> = {}): Partial<ReportForm> => ({
    id: 'report-1',
    user_id: 'author-1',
    ...overrides
});

beforeEach(() => {
    getFromStore.mockReset();
    inFilter.mockReset();
    getFromStore.mockResolvedValue(undefined);
    inFilter.mockResolvedValue({ data: [], error: null });
    vi.stubGlobal('navigator', { onLine: true });
});

describe('getReportAuthor', () => {
    it('returns the report author, never the downloading user', () => {
        const author = makeProfile();
        const downloader = makeProfile({ id: 'downloader', name: 'Ivana', last_name: 'Milas' });
        const authors = new Map([[author.id, author]]);

        expect(getReportAuthor(makeReport(), authors, downloader)).toBe(author);
    });

    it('resolves each report of a mixed-author bundle separately', () => {
        const a = makeProfile({ id: 'a', name: 'Ana', last_name: 'Anic' });
        const b = makeProfile({ id: 'b', name: 'Boris', last_name: 'Boric' });
        const authors = new Map([['a', a], ['b', b]]);

        expect(getReportAuthor(makeReport({ user_id: 'a' }), authors)).toBe(a);
        expect(getReportAuthor(makeReport({ user_id: 'b' }), authors)).toBe(b);
    });

    it('falls back to the current user for an unsaved report with no user_id', () => {
        const current = makeProfile({ id: 'current' });

        expect(getReportAuthor({ id: 'draft' }, new Map(), current)).toBe(current);
        expect(getReportAuthor(makeReport({ user_id: '' }), new Map(), current)).toBe(current);
        expect(getReportAuthor({ id: 'draft' }, new Map())).toBeUndefined();
    });

    it('returns undefined for an unresolvable author even when a fallback exists', () => {
        const downloader = makeProfile({ id: 'downloader' });

        expect(getReportAuthor(makeReport({ user_id: 'ghost' }), new Map(), downloader)).toBeUndefined();
    });
});

describe('formatAuthorName', () => {
    it('joins name and last name', () => {
        expect(formatAuthorName(makeProfile())).toBe('Ivan Horvat');
    });

    it('returns null when there is no usable name', () => {
        expect(formatAuthorName(undefined)).toBeNull();
        expect(formatAuthorName(makeProfile({ name: '', last_name: '' }))).toBeNull();
    });
});

describe('resolveReportAuthors', () => {
    it('resolves from the offline cache without touching the network', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        getFromStore.mockResolvedValue(makeProfile());

        const authors = await resolveReportAuthors([makeReport()]);

        expect(authors.get('author-1')?.name).toBe('Ivan');
        expect(inFilter).not.toHaveBeenCalled();
    });

    it('deduplicates ids and fetches only what the cache is missing', async () => {
        const cached = makeProfile({ id: 'a' });
        getFromStore.mockImplementation(async (_store: string, id: string) => (id === 'a' ? cached : undefined));
        inFilter.mockResolvedValue({ data: [makeProfile({ id: 'b', name: 'Boris' })], error: null });

        const authors = await resolveReportAuthors([
            makeReport({ user_id: 'a' }),
            makeReport({ user_id: 'a' }),
            makeReport({ user_id: 'b' })
        ]);

        expect(inFilter).toHaveBeenCalledTimes(1);
        expect(inFilter).toHaveBeenCalledWith('id', ['b']);
        expect(authors.get('a')).toBe(cached);
        expect(authors.get('b')?.name).toBe('Boris');
    });

    it('does nothing when no report has an author', async () => {
        const authors = await resolveReportAuthors([{ id: 'draft' }, { id: 'draft-2', user_id: '' }]);

        expect(authors.size).toBe(0);
        expect(getFromStore).not.toHaveBeenCalled();
        expect(inFilter).not.toHaveBeenCalled();
    });

    it('resolves to an empty map instead of throwing when every lookup fails', async () => {
        getFromStore.mockRejectedValue(new Error('IndexedDB unavailable'));
        inFilter.mockRejectedValue(new Error('offline'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(resolveReportAuthors([makeReport()])).resolves.toEqual(new Map());
    });

    it('resolves to an empty map when the query returns an error', async () => {
        inFilter.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(resolveReportAuthors([makeReport()])).resolves.toEqual(new Map());
    });
});
