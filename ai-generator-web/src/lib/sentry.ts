import * as Sentry from '@sentry/react';

export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    // Only initialize if DSN is provided
    if (!dsn) {
        console.log('Sentry DSN not configured - error tracking disabled');
        return;
    }

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,

        // Performance Monitoring
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Session Replay (captures user interactions for debugging)
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Enable structured logging
        _experiments: {
            enableLogs: true,
        },

        // Integrations
        integrations: [
            // Capture console.warn and console.error as logs
            Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
            // Browser tracing for performance
            Sentry.browserTracingIntegration(),
        ],

        // Filter out noisy errors
        ignoreErrors: [
            // Network errors
            'Failed to fetch',
            'NetworkError',
            'Load failed',
            // Browser extensions
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
            // Common benign errors
            'ResizeObserver loop',
            'Non-Error promise rejection',
        ],

        // Don't send in development unless explicitly enabled
        enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === 'true',

        beforeSend(event) {
            // Remove sensitive data
            if (event.request?.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
            }
            return event;
        },
    });
};

// Export Sentry for manual error capture
export { Sentry };

// Helper to capture errors with context
// Handles both Error instances and plain objects (like Supabase PostgrestError)
export const captureError = (error: unknown, context?: Record<string, unknown>) => {
    let errorToCapture: Error;

    if (error instanceof Error) {
        errorToCapture = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Handle Supabase PostgrestError and similar plain objects
        const errorObj = error as { message: string; code?: string; details?: string; hint?: string };
        errorToCapture = new Error(errorObj.message);
        errorToCapture.name = errorObj.code || 'SupabaseError';
        // Preserve original error details in context
        context = {
            ...context,
            originalError: {
                code: errorObj.code,
                details: errorObj.details,
                hint: errorObj.hint,
            },
        };
    } else {
        // Fallback for any other type
        errorToCapture = new Error(String(error));
    }

    Sentry.captureException(errorToCapture, {
        extra: context,
    });
};

// Helper to set user context (call after login)
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
};

// Helper to clear user context (call after logout)
export const clearUserContext = () => {
    Sentry.setUser(null);
};

// ============================================
// TRACING / PERFORMANCE MONITORING
// ============================================

/**
 * Trace an async operation (API calls, data fetching)
 * @example
 * const data = await traceAsync('fetchCustomers', 'http.client', async () => {
 *   return await customerService.getAll();
 * });
 */
export const traceAsync = async <T>(
    name: string,
    op: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> => {
    return Sentry.startSpan(
        { name, op },
        async (span) => {
            if (attributes && span) {
                Object.entries(attributes).forEach(([key, value]) => {
                    span.setAttribute(key, value);
                });
            }
            return await fn();
        }
    );
};

/**
 * Trace a synchronous operation (UI actions, calculations)
 * @example
 * traceSync('calculateReport', 'ui.task', () => {
 *   return calculateWaterReport(formData);
 * });
 */
export const traceSync = <T>(
    name: string,
    op: string,
    fn: () => T,
    attributes?: Record<string, string | number | boolean>
): T => {
    return Sentry.startSpan(
        { name, op },
        (span) => {
            if (attributes && span) {
                Object.entries(attributes).forEach(([key, value]) => {
                    span.setAttribute(key, value);
                });
            }
            return fn();
        }
    );
};

/**
 * Trace a button click or UI interaction
 * @example
 * <button onClick={() => traceClick('Export PDF', handleExport)}>Export</button>
 */
export const traceClick = (name: string, fn: () => void) => {
    Sentry.startSpan(
        { name, op: 'ui.click' },
        () => fn()
    );
};

// ============================================
// STRUCTURED LOGGING
// ============================================

/**
 * Structured logger for important events
 * Use instead of console.log for events you want tracked
 */
export const logger = {
    info: (message: string, data?: Record<string, unknown>) => {
        Sentry.addBreadcrumb({
            category: 'info',
            message,
            data,
            level: 'info',
        });
    },

    warn: (message: string, data?: Record<string, unknown>) => {
        Sentry.addBreadcrumb({
            category: 'warning',
            message,
            data,
            level: 'warning',
        });
    },

    error: (message: string, data?: Record<string, unknown>) => {
        Sentry.addBreadcrumb({
            category: 'error',
            message,
            data,
            level: 'error',
        });
    },

    // Log user actions (navigation, clicks, form submissions)
    action: (action: string, data?: Record<string, unknown>) => {
        Sentry.addBreadcrumb({
            category: 'user.action',
            message: action,
            data,
            level: 'info',
        });
    },

    // Log API calls
    api: (method: string, url: string, status?: number) => {
        Sentry.addBreadcrumb({
            category: 'api',
            message: `${method} ${url}`,
            data: { status },
            level: status && status >= 400 ? 'error' : 'info',
        });
    },
};
