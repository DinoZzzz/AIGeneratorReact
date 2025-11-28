/**
 * Memoized date formatting utilities
 *
 * Uses cached Intl.DateTimeFormat instances for better performance
 * instead of creating new formatters on every call.
 */

// Cache for DateTimeFormat instances
const formatterCache = new Map<string, Intl.DateTimeFormat>();

// Default locale for the app (Croatian)
const DEFAULT_LOCALE = 'hr-HR';

/**
 * Gets or creates a cached DateTimeFormat instance
 */
function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale}-${JSON.stringify(options)}`;

    let formatter = formatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, options);
        formatterCache.set(key, formatter);
    }

    return formatter;
}

/**
 * Formats a date to a localized date string (e.g., "28. 11. 2025.")
 */
export function formatDate(date: Date | string | null | undefined, locale: string = DEFAULT_LOCALE): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    const formatter = getFormatter(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    return formatter.format(dateObj);
}

/**
 * Formats a date to a localized date and time string (e.g., "28. 11. 2025. 14:30")
 */
export function formatDateTime(date: Date | string | null | undefined, locale: string = DEFAULT_LOCALE): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    const formatter = getFormatter(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return formatter.format(dateObj);
}

/**
 * Formats a date with full weekday and month names (e.g., "petak, 28. studenog 2025.")
 */
export function formatDateLong(date: Date | string | null | undefined, locale: string = DEFAULT_LOCALE): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    const formatter = getFormatter(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return formatter.format(dateObj);
}

/**
 * Formats time only (e.g., "14:30")
 */
export function formatTime(date: Date | string | null | undefined, locale: string = DEFAULT_LOCALE): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    const formatter = getFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });

    return formatter.format(dateObj);
}

/**
 * Gets today's date formatted with full weekday and month
 */
export function formatTodayLong(locale: string = DEFAULT_LOCALE): string {
    return formatDateLong(new Date(), locale);
}

/**
 * Gets today's date formatted short
 */
export function formatTodayShort(locale: string = DEFAULT_LOCALE): string {
    return formatDate(new Date(), locale);
}
