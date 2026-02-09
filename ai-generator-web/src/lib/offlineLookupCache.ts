import { supabase } from './supabase';
import { getMetadata, saveMetadata } from './offlineDb';

const LOOKUP_CACHE_PREFIX = 'lookup_cache';

interface LookupCacheEntry<T> {
  data: T[];
  updatedAt: number;
}

interface LookupSpec {
  table: string;
  orderBy: string;
}

export const DEFAULT_LOOKUP_PREWARM: LookupSpec[] = [
  { table: 'examination_procedures', orderBy: 'id' },
  { table: 'report_drafts', orderBy: 'id' },
  { table: 'material_types', orderBy: 'id' },
  { table: 'materials', orderBy: 'id' },
  { table: 'materials', orderBy: 'name' },
];

const buildCacheKey = (table: string, orderBy: string): string =>
  `${LOOKUP_CACHE_PREFIX}:${table}:${orderBy}`;

const readCachedLookup = async <T>(table: string, orderBy: string): Promise<T[] | null> => {
  const cacheKey = buildCacheKey(table, orderBy);
  const cached = await getMetadata<LookupCacheEntry<T>>(cacheKey);
  if (!cached?.data || !Array.isArray(cached.data)) {
    return null;
  }
  return cached.data;
};

const cacheLookup = async <T>(table: string, orderBy: string, data: T[]): Promise<void> => {
  const cacheKey = buildCacheKey(table, orderBy);
  await saveMetadata(cacheKey, {
    data,
    updatedAt: Date.now(),
  } satisfies LookupCacheEntry<T>);
};

export const getLookupWithOfflineFallback = async <T>(
  table: string,
  orderBy: string
): Promise<T[]> => {
  const fetchOnline = async (): Promise<T[]> => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending: true });

    if (error) throw error;

    const typedData = (data || []) as T[];
    await cacheLookup<T>(table, orderBy, typedData);
    return typedData;
  };

  if (navigator.onLine) {
    try {
      return await fetchOnline();
    } catch (onlineError) {
      const cached = await readCachedLookup<T>(table, orderBy);
      if (cached) return cached;
      throw onlineError;
    }
  }

  const cached = await readCachedLookup<T>(table, orderBy);
  if (cached) return cached;

  throw new Error(`No offline lookup cache available for table "${table}"`);
};

/**
 * Warm required lookup caches while online so forms can work fully offline.
 */
export const prewarmLookupCache = async (
  lookups: LookupSpec[] = DEFAULT_LOOKUP_PREWARM
): Promise<void> => {
  if (!navigator.onLine) return;

  await Promise.all(lookups.map(async ({ table, orderBy }) => {
    try {
      await getLookupWithOfflineFallback(table, orderBy);
    } catch (error) {
      console.warn(`Failed to prewarm lookup cache for ${table}.${orderBy}:`, error);
    }
  }));
};
