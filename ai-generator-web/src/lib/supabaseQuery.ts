import { AppError } from './errorHandler';

type SupabaseResponse<T> = {
    data: T | null;
    error: { message: string; code?: string } | null;
    count?: number | null;
};

/**
 * Wrapper for Supabase queries that provides consistent error handling.
 * Reduces boilerplate code in services by automatically converting Supabase errors to AppErrors.
 *
 * @example
 * // Before:
 * const { data, error } = await supabase.from('customers').select('*');
 * if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
 * return data;
 *
 * // After:
 * return supabaseQuery(() => supabase.from('customers').select('*'));
 */
export async function supabaseQuery<T>(
    queryFn: () => Promise<SupabaseResponse<T>>
): Promise<T> {
    const { data, error } = await queryFn();

    if (error) {
        throw new AppError(error.message, error.code || 'SUPABASE_ERROR', 500);
    }

    return data as T;
}

/**
 * Wrapper for Supabase queries that returns both data and count (for pagination).
 *
 * @example
 * const { data, count } = await supabaseQueryWithCount(() =>
 *     supabase.from('customers').select('*', { count: 'exact' })
 * );
 */
export async function supabaseQueryWithCount<T>(
    queryFn: () => Promise<SupabaseResponse<T>>
): Promise<{ data: T; count: number }> {
    const { data, error, count } = await queryFn();

    if (error) {
        throw new AppError(error.message, error.code || 'SUPABASE_ERROR', 500);
    }

    return { data: data as T, count: count || 0 };
}

/**
 * Wrapper for Supabase queries that expect a single result.
 * Returns null if no result found instead of throwing.
 *
 * @example
 * const customer = await supabaseQuerySingle(() =>
 *     supabase.from('customers').select('*').eq('id', customerId).single()
 * );
 */
export async function supabaseQuerySingle<T>(
    queryFn: () => Promise<SupabaseResponse<T>>
): Promise<T | null> {
    const { data, error } = await queryFn();

    if (error) {
        // PGRST116 is "no rows returned" - not an error for optional lookups
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new AppError(error.message, error.code || 'SUPABASE_ERROR', 500);
    }

    return data;
}

/**
 * Wrapper for Supabase mutation operations (insert, update, delete).
 *
 * @example
 * await supabaseMutation(() =>
 *     supabase.from('customers').delete().eq('id', customerId)
 * );
 */
export async function supabaseMutation<T>(
    mutationFn: () => Promise<SupabaseResponse<T>>
): Promise<T | null> {
    const { data, error } = await mutationFn();

    if (error) {
        throw new AppError(error.message, error.code || 'SUPABASE_ERROR', 500);
    }

    return data;
}
