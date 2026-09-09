/**
 * Uploaded (and offline-cached) templates can repeat the results-table number
 * before the air-method heading. Normalize the rendered paragraph so both
 * literal numbers and template tags are handled, including text split by Word
 * into separate formatting runs. Results-table captions keep their numbering.
 */
export const removeAirMethodHeadingTablePrefix = (documentXml: string): string =>
    documentXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (paragraph) => {
        const textRuns = [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)];
        const text = textRuns.map((run) => run[1]).join('');
        const prefix = text.match(/^\s*Tablica\s+br\.?\s*\d+\s*(?=METODA\s+ISPITIVANJA\s+ZRAKOM\b)/i);
        if (!prefix) return paragraph;

        let remaining = prefix[0].length;
        return paragraph.replace(/(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g, (_run, open, content: string, close) => {
            const removed = Math.min(remaining, content.length);
            remaining -= removed;
            return `${open}${content.slice(removed)}${close}`;
        });
    });
