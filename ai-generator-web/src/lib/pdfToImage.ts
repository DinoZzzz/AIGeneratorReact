import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set up the worker - use worker from public directory
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Converts a PDF blob to an array of image data URLs (one per page)
 */
export const convertPdfToImages = async (pdfBlob: Blob, scale: number = 2): Promise<string[]> => {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Convert canvas to image data URL
        const imageDataUrl = canvas.toDataURL('image/png');
        images.push(imageDataUrl);
    }

    return images;
};

/**
 * Converts a data URL to ArrayBuffer for use with docxtemplater
 */
export const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
