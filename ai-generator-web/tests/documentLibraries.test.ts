import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import { createSoftBreakModule } from '../src/services/wordExport/softBreakModule';

const logo = readFileSync(new URL('../public/icon-192x192.png', import.meta.url));

describe('document library compatibility', () => {
    it('renders the shipped Word template with an embedded image using the patched XML parser', () => {
        const zip = new PizZip(readFileSync(new URL('../public/templates/method1610.docx', import.meta.url)));
        // Add an image paragraph to exercise the same module used for report
        // attachments and signatures, independently of stored template contents.
        const source = zip.file('word/document.xml')!.asText();
        zip.file('word/document.xml', source.replace(
            '</w:body>',
            '<w:p><w:r><w:t>{%smokeImage}</w:t></w:r></w:p></w:body>',
        ));
        const imageModule = new ImageModule({
            centered: false,
            getImage: () => logo,
            getSize: () => [96, 96],
        });
        const document = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: false,
            modules: [imageModule, createSoftBreakModule()],
            nullGetter: () => '',
        });
        document.render({
            customerName: 'Regression customer',
            constructionSite: 'Regression construction',
            hasAirTests: true,
            hasWaterTests: true,
            satisfies: 'ZADOVOLJAVA',
            smokeImage: 'logo',
        });

        const result = new PizZip(document.getZip().generate({ type: 'nodebuffer' }));
        const documentXml = result.file('word/document.xml')!.asText();
        expect(documentXml).toContain('Regression customer');
        expect(documentXml).toContain('ZADOVOLJAVA');
        expect(documentXml).toContain('<w:drawing>');
        expect(documentXml).not.toContain('{%smokeImage}');
        const embeddedImages = result.file(/^word\/media\//);
        expect(embeddedImages.some((file) => Buffer.from(file.asUint8Array()).equals(logo))).toBe(true);
        expect(result.file('word/_rels/document.xml.rels')!.asText()).toContain('relationships/image');
    });

    it('generates a readable multi-page PDF with images and tables', async () => {
        const document = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        document.text('Inspection report', 20, 20);
        document.addImage(new Uint8Array(logo), 'PNG', 20, 30, 30, 30);
        autoTable(document, { startY: 70, head: [['Section', 'Result']], body: [['A', 'PASS']] });
        document.addPage();
        document.text('Second report', 20, 20);

        const bytes = document.output('arraybuffer');
        const parsed = await PDFDocument.load(bytes);
        expect(parsed.getPageCount()).toBe(2);
        expect(parsed.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
        expect(Buffer.from(bytes).toString('latin1')).toContain('Inspection report');
        expect(Buffer.from(bytes).toString('latin1')).toContain('/Subtype /Image');
    });
});
