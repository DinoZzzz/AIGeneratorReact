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
export const captureError = (error: Error, context?: Record<string, unknown>) => {
    Sentry.captureException(error, {
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
