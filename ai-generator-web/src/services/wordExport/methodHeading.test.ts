import { describe, expect, it } from 'vitest';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { removeAirMethodHeadingTablePrefix } from './methodHeading';

const heading = 'METODA ISPITIVANJA ZRAKOM „L“';
const airCaption = 'Prikaz rezultata ispitivanja odvodnje - metoda zrak „L“';
const waterCaption = 'Prikaz rezultata ispitivanja odvodnje - metoda voda „W“';
const paragraph = (text: string) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const visibleText = (xml: string) => [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((run) => run[1]).join('');

describe('Word air-method heading', () => {
    it('removes the duplicate prefix when Word splits it across formatting runs, preserving heading styles', () => {
        const styledHeading = `<w:r><w:rPr><w:b/></w:rPr><w:t>${heading}</w:t></w:r>`;
        const xml = `<w:p w:rsidR="123"><w:pPr><w:keepNext/></w:pPr><w:r><w:t>Tab</w:t></w:r><w:r><w:t>lica br.</w:t></w:r><w:r><w:t xml:space="preserve">1 </w:t></w:r>${styledHeading}</w:p>`;

        const result = removeAirMethodHeadingTablePrefix(xml);

        expect(visibleText(result)).toBe(heading);
        expect(result).toContain(styledHeading);
        expect(result).toContain('<w:p w:rsidR="123"><w:pPr><w:keepNext/></w:pPr>');
    });

    it('normalizes a rendered template tag while keeping the air and water results-table numbers', () => {
        const zip = new PizZip();
        zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph(`{airMethodTableName} ${heading}`)}${paragraph(`{airMethodTableName} ${airCaption}`)}${paragraph(`{waterMethodTableName} ${waterCaption}`)}</w:body></w:document>`);
        const doc = new Docxtemplater(zip);
        doc.render({ airMethodTableName: 'Tablica br.1', waterMethodTableName: 'Tablica br.2' });

        const result = removeAirMethodHeadingTablePrefix(doc.getZip().file('word/document.xml')!.asText());

        expect(visibleText(result)).toBe(`${heading}Tablica br.1 ${airCaption}Tablica br.2 ${waterCaption}`);
    });

    it.each(['Tablica br.1 ', '  Tablica br. 1\u00a0', 'Tablica br.2 '])('removes literal prefix %j in the same text run as the heading', (prefix) => {
        expect(removeAirMethodHeadingTablePrefix(paragraph(prefix + heading))).toBe(paragraph(heading));
    });

    it('leaves corrected headings, result captions, and other text unchanged', () => {
        const xml = paragraph(heading) + paragraph(`Tablica br.1 ${airCaption}`) + paragraph(`Tablica br.1 ${waterCaption}`) + paragraph('Vidi Tablica br.1 METODA ISPITIVANJA ZRAKOM „L“');

        expect(removeAirMethodHeadingTablePrefix(xml)).toBe(xml);
    });
});
