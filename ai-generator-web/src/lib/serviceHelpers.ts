import { captureError } from './sentry';
import { AppError, NotFoundError, isAuthError, withAuthRetry } from './errorHandler';

/**
 * Shared Supabase query execution for the service layer.
 *
 * Wraps the repeated pattern of: run query → on auth error rethrow (so React
 * Query's retry can refresh the JWT) → on other errors report to Sentry and
 * throw an AppError. Every call also gets withAuthRetry, so an expired token
 * is refreshed and retried once before failing.
 */

export interface QueryContext {
    service: string;
    method: string;
    [key: string]: unknown;
}

export interface ExecQueryOptions {
    /** Entity name for NotFoundError when .single() finds no row (PGRST116). */
    notFoundEntity?: string;
}

interface SupabaseError {
    message: string;
    code?: string;
}

const handleQueryError = (error: SupabaseError, context: QueryContext, options?: ExecQueryOptions): never => {
    if (options?.notFoundEntity && error.code === 'PGRST116') {
        throw new NotFoundError(options.notFoundEntity);
    }
    if (isAuthError(error)) throw error;
    captureError(error, context);
    throw new AppError(error.message, 'SUPABASE_ERROR', 500);
};

/**
 * Execute a query and return the full result (for callers that need `count`
 * alongside `data`). The result is error-checked before being returned.
 */
export async function execQueryRaw<R extends { error: SupabaseError | null }>(
    context: QueryContext,
    run: () => PromiseLike<R>,
    options?: ExecQueryOptions,
): Promise<R> {
    return withAuthRetry(async () => {
        const result = await run();
        if (result.error) {
            handleQueryError(result.error, context, options);
        }
        return result;
    });
}

/** Execute a query and return its `data`. */
export async function execQuery<T>(
    context: QueryContext,
    run: () => PromiseLike<{ data: T; error: SupabaseError | null }>,
    options?: ExecQueryOptions,
): Promise<T> {
    const { data } = await execQueryRaw(context, run, options);
    return data;
}
