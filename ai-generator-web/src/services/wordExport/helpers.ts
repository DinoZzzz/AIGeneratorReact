import type { ImageDimensions } from './types';

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value: number): string => value.toString().padStart(2, '0');

export const sanitizeWordString = (value: string): string => value.replace(/[\u00A0\u2007\u202F]/g, ' ');

export const sanitizeWordData = <T>(value: T): T => {
    if (typeof value === 'string') {
        return sanitizeWordString(value) as T;
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeWordData(item)) as T;
    }
    if (value && typeof value === 'object') {
        const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
            key,
            sanitizeWordData(nestedValue)
        ]);
        return Object.fromEntries(sanitizedEntries) as T;
    }
    return value;
};

export const formatDate = (dateValue: string | number | Date | null | undefined): string => {
    if (dateValue === null || dateValue === undefined || dateValue === '') return '-';

    if (typeof dateValue === 'string') {
        const dateOnlyMatch = dateValue.match(DATE_ONLY_REGEX);
        if (dateOnlyMatch) {
            const [, year, month, day] = dateOnlyMatch;
            return `${day}.${month}.${year}.`;
        }
    }

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}.`;
};

export const formatNum = (num: number | undefined | null, decimals = 2): string => {
    if (num === undefined || num === null) return '-';
    return num.toFixed(decimals).replace('.', ',');
};

export const getImageDimensions = (url: string): Promise<ImageDimensions> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            resolve({ width: 600, height: 400 });
        };
        img.src = url;
    });
};
