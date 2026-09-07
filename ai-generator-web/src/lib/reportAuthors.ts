import type { Profile, ReportForm } from '../types';
import { STORES, getFromStore } from './offlineDb';
import { supabase } from './supabase';

// Same column set examinerService.getExaminers() reads, so a cache hit and a
// network hit produce the same shape.
const PROFILE_COLUMNS = 'id, name, last_name, username, email, title, gender, avatar_url, role, accreditations';

/**
 * Resolve the author (ReportForm.user_id) of each report in one batch.
 *
 * Cache-first: profiles are mirrored into STORES.EXAMINERS by the pull sync, so
 * field exports resolve without a network round trip. Only ids still missing
 * after the cache pass are fetched, in a single request. Never throws — an
 * unresolved id simply stays out of the map, because a footer lookup must not
 * abort a page render.
 */
export const resolveReportAuthors = async (
    reports: Partial<ReportForm>[]
): Promise<Map<string, Profile>> => {
    const authors = new Map<string, Profile>();
    const ids = Array.from(new Set(
        reports
            .map((report) => report.user_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ));
    if (ids.length === 0) return authors;

    await Promise.all(ids.map(async (id) => {
        try {
            const cached = await getFromStore<Profile>(STORES.EXAMINERS, id);
            if (cached) authors.set(id, cached);
        } catch {
            // IndexedDB unavailable — fall through to the network below
        }
    }));

    const missing = ids.filter((id) => !authors.has(id));
    if (missing.length === 0) return authors;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return authors;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select(PROFILE_COLUMNS)
            .in('id', missing);
        if (error) throw error;
        (data as Profile[] | null)?.forEach((profile) => authors.set(profile.id, profile));
    } catch {
        console.warn('Failed to resolve report authors, falling back to unknown user');
    }

    return authors;
};

/**
 * Author of a single report.
 *
 * A report with no user_id is an unsaved form being exported straight from the
 * editor — there the current user genuinely is the author, so the caller's
 * fallback applies. A report that HAS a user_id but cannot be resolved must not
 * borrow the downloader's name: that is the reported bug, and a wrong name on an
 * accredited document is worse than an honest "unknown".
 */
export const getReportAuthor = (
    report: Partial<ReportForm>,
    authors: Map<string, Profile>,
    fallbackProfile?: Profile
): Profile | undefined => {
    if (!report.user_id) return fallbackProfile;
    return authors.get(report.user_id);
};

/** `null` when there is no name to print, so callers can pick their own label. */
export const formatAuthorName = (author?: Profile): string | null => {
    if (!author) return null;
    const name = `${author.name || ''} ${author.last_name || ''}`.trim();
    return name || null;
};
