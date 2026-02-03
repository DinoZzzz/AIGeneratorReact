import type PizZip from 'pizzip';

export interface RawTagPlacementIssue {
    file: string;
    tag: string;
    index: number;
    reason: string;
}

const RAW_TAG_REGEX = /\{%([a-zA-Z0-9_]+)\}/g;

const getXmlFiles = (zip: PizZip): string[] => {
    const files = Object.keys(zip.files);
    return files.filter((name) =>
        name === 'word/document.xml' ||
        name.startsWith('word/header') ||
        name.startsWith('word/footer')
    );
};

const isInsideParagraph = (content: string, index: number): boolean => {
    const lastParagraphOpen = content.lastIndexOf('<w:p', index);
    if (lastParagraphOpen === -1) {
        return false;
    }
    const lastParagraphClose = content.lastIndexOf('</w:p>', index);
    return lastParagraphClose < lastParagraphOpen;
};

export const findRawTagPlacementIssues = (
    zip: PizZip,
    allowedTags?: string[]
): RawTagPlacementIssue[] => {
    const issues: RawTagPlacementIssue[] = [];
    const xmlFiles = getXmlFiles(zip);

    for (const fileName of xmlFiles) {
        const file = zip.file(fileName);
        if (!file) continue;

        const content = file.asText();
        let match: RegExpExecArray | null;
        while ((match = RAW_TAG_REGEX.exec(content)) !== null) {
            const tag = match[1];
            if (allowedTags && !allowedTags.includes(tag)) {
                continue;
            }

            if (!isInsideParagraph(content, match.index)) {
                issues.push({
                    file: fileName,
                    tag,
                    index: match.index,
                    reason: 'Raw tag must be placed inside a paragraph (<w:p>).'
                });
            }
        }
    }

    return issues;
};
