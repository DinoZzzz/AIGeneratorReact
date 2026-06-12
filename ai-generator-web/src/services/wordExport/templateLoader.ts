import { supabase } from '../../lib/supabase';
import { getFromStore, saveToStore, STORES } from '../../lib/offlineDb';

interface CachedTemplateFile {
    id: string;
    version: string | null;
    content: ArrayBuffer;
    cachedAt: number;
}

const templateCacheId = (path: string) => `template_file_${path}`;

/**
 * The template can be re-uploaded by admins (same storage path), so a plain
 * URL would be served stale from HTTP/SW caches. Instead of cache-busting
 * every request, key the download by the storage object's updated_at: the URL
 * stays stable (cacheable) between uploads and changes when a new template
 * is uploaded.
 */
const getRemoteVersion = async (path: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage
            .from('templates')
            .list('', { search: path, limit: 10 });

        if (error) return null;
        const file = data?.find((entry) => entry.name === path);
        return file?.updated_at || file?.created_at || null;
    } catch {
        return null;
    }
};

export const loadFile = async (path: string): Promise<ArrayBuffer> => {
    const cacheId = templateCacheId(path);
    const [version, cached] = await Promise.all([
        getRemoteVersion(path),
        getFromStore<CachedTemplateFile>(STORES.TEMPLATE_CACHE, cacheId).catch(() => undefined),
    ]);

    if (cached && version && cached.version === version) {
        return cached.content;
    }

    const { data } = supabase.storage
        .from('templates')
        .getPublicUrl(path);

    if (!data.publicUrl) {
        throw new Error('Failed to get public URL for template');
    }

    const url = version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download template: ${response.statusText}`);
        }

        const content = await response.arrayBuffer();
        await saveToStore(STORES.TEMPLATE_CACHE, {
            id: cacheId,
            version,
            content,
            cachedAt: Date.now(),
        } satisfies CachedTemplateFile).catch(() => {});
        return content;
    } catch (error) {
        // Offline / fetch failure: fall back to the last successfully downloaded template
        if (cached) {
            return cached.content;
        }
        throw error;
    }
};
