// Roboto font loader for jsPDF with Croatian/Slovenian character support.
// The fonts are subsetted (Basic Latin, Latin-1, Latin Extended-A, punctuation)
// and shipped as binary .ttf assets; jsPDF needs them as base64, so they are
// fetched and converted on first use, then reused for the rest of the session.
import robotoRegularUrl from '../../assets/fonts/Roboto-Regular-subset.ttf?url';
import robotoBoldUrl from '../../assets/fonts/Roboto-Bold-subset.ttf?url';

export interface RobotoFonts {
    regular: string;
    bold: string;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

const fetchFontAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load PDF font (${response.status}): ${url}`);
    }
    return arrayBufferToBase64(await response.arrayBuffer());
};

let fontsPromise: Promise<RobotoFonts> | null = null;

export const loadRobotoFonts = (): Promise<RobotoFonts> => {
    if (!fontsPromise) {
        fontsPromise = Promise.all([
            fetchFontAsBase64(robotoRegularUrl),
            fetchFontAsBase64(robotoBoldUrl),
        ])
            .then(([regular, bold]) => ({ regular, bold }))
            .catch((error) => {
                // Allow a retry on the next export instead of caching the failure
                fontsPromise = null;
                throw error;
            });
    }
    return fontsPromise;
};
