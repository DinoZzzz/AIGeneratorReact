import type { ImageDimensions } from './types';

export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hr-HR');
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
