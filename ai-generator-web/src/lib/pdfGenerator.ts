import jsPDF from 'jspdf';
import type { ReportForm } from '../types';
import * as calc from './calculations/report';

// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

export const generatePDF = async (report: Partial<ReportForm>) => {
    const doc = new jsPDF();
    await renderReportPage(doc, report);
    doc.save(`report_${report.id || 'new'}.pdf`);
};



export const generateBulkPDF = async (reports: Partial<ReportForm>[], filename: string = 'reports_bundle.pdf') => {
    const doc = new jsPDF();

    // Pre-load common assets once if possible, or just load per page.
    // For simplicity and reliability, we'll reuse the logic but we need to refactor the single page generation
    // into a helper function that takes the `doc` object.

    // However, refactoring `generatePDF` might be risky if I break it.
    // Instead, I'll copy the logic into a helper `generatePage` and make `generatePDF` use it.
    // Or better, just iterate here.

    // Let's refactor `generatePDF` to use a shared `renderReportPage` function.
    // But first, let's just implement the loop here to minimize impact on existing function if I mess up.
    // Actually, code duplication is bad. Let's extract the rendering logic.

    for (let i = 0; i < reports.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        await renderReportPage(doc, reports[i]);
    }

    doc.save(filename);
};

// Extracted rendering logic
const renderReportPage = async (doc: jsPDF, report: Partial<ReportForm>) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load Assets
    let logoImg, sketchImg, tableImg;
    try {
        logoImg = await loadImage('/assets/ai_icon.png');
        const schemeNum = report.draft_id || 1;
        sketchImg = await loadImage(`/assets/Scheme${schemeNum}.PNG`);

        if (report.type_id === 2) {
            tableImg = await loadImage('/assets/table.PNG');
        }
    } catch (e) {
        console.warn('Failed to load some images', e);
    }

    // --- Header ---
    // Logo
    if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 20, 25, 25);
    }

    // Company Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GRAĐEVINSKI LABORATORIJ', 60, 25);
    doc.setFont('helvetica', 'bold');
    doc.text('ANTE-INŽENJERSTVO d.o.o.', 60, 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Petra Krešimira 19 ; 21 266 Zmijavci', 60, 35);
    doc.text('www.ante-inzenjerstvo.hr', 60, 40);

    // Vertical Line
    doc.setDrawColor(0);
    doc.line(50, 20, 50, 50);
    doc.line(110, 20, 110, 50);

    // Report Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const title = report.type_id === 1
        ? 'ISPITIVANJE VODONEPROPUSNOSTI\nCJEVOVODA I KONTROLNA OKNA\nPREMA HRN EN 1610:2015 - L'
        : 'ISPITIVANJE VODONEPROPUSNOSTI\nCJEVOVODA METODA ZRAK\nPREMA HRN EN 1610:2015 - L';
    doc.text(title, 115, 25, { maxWidth: 60, align: 'left' });

    // Vertical Line
    doc.line(180, 20, 180, 50);

    // Report Meta
    doc.setFontSize(10);
    doc.text(report.construction?.work_order || 'N/A', 185, 25);
    doc.setFont('helvetica', 'normal');
    doc.text('OB 21-2', 185, 30);
    doc.text('Izdanje: 2', 185, 35);
    doc.text(`Datum: ${new Date().toLocaleDateString('hr-HR')}`, 185, 40);

    // --- Status Banner ---
    const satisfies = report.satisfies;
    const statusText = satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA';
    const statusColor = satisfies ? '#008000' : '#FF0000';

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor);
    doc.text(statusText, pageWidth / 2, 65, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset

    // --- Data Sections ---
    let currentY = 80;

    // Helper for key-value rows
    const drawRow = (key: string, value: string, x: number, y: number) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(key + ':', x, y);
        doc.setFont('helvetica', 'bold');
        doc.text(value, x + 50, y); // Value offset
    };

    // Basic Info (Left)
    drawRow('Temperatura', `${report.temperature} °C`, 20, currentY);
    drawRow('Datum ispitivanja', report.examination_date || '-', 20, currentY + 5);

    // Sketch (Right)
    doc.setFont('helvetica', 'normal');
    doc.text('Skica:', 100, currentY);
    if (sketchImg) {
        // Fit image
        const maxWidth = 80;
        const maxHeight = 50;
        const ratio = sketchImg.width / sketchImg.height;
        let w = maxWidth;
        let h = w / ratio;
        if (h > maxHeight) {
            h = maxHeight;
            w = h * ratio;
        }
        doc.addImage(sketchImg, 'PNG', 110, currentY + 5, w, h);
    }

    currentY += 60; // Move down past sketch

    // --- Detailed Data ---
    const leftX = 20;
    const rightX = 110;
    let leftY = currentY;
    let rightY = currentY;

    // Left Column: Pane Data
    doc.setFontSize(10);
    const addLeft = (k: string, v: string) => {
        drawRow(k, v, leftX, leftY);
        leftY += 5;
    };

    addLeft('Dionica', report.stock || '-');
    addLeft('Tip', report.material_type_id === 1 ? 'Okna' : 'Cijev');

    if (report.type_id === 1) { // Water
        if (report.material_type_id === 1) {
            addLeft('Visina ro', `${(report.ro_height || 0).toFixed(2)} m`);
            addLeft('Promjer okna', `${(report.pane_diameter || 0).toFixed(2)} m`);
            addLeft('Visina vode', `${(report.water_height || 0).toFixed(2)} m`);
        } else {
            addLeft('Širina okna', `${(report.pane_width || 0).toFixed(2)} m`);
            addLeft('Dužina okna', `${(report.pane_length || 0).toFixed(2)} m`);
            addLeft('Visina okna', `${(report.pane_height || 0).toFixed(2)} m`);
            addLeft('Visina vode', `${(report.water_height || 0).toFixed(2)} m`);
        }
    } else { // Air
        if (report.draft_id === 1 || report.draft_id === 3) { // Shaft involved
            addLeft('Promjer okna', `${(report.pane_diameter || 0).toFixed(2)} m`);
        }
    }

    // Right Column: Pipe / Measurements
    const addRight = (k: string, v: string) => {
        drawRow(k, v, rightX, rightY);
        rightY += 5;
    };

    if (report.type_id === 1) { // Water
        if (report.draft_id !== 1) { // Pipe involved
            addRight('Dužina cijevi', `${(report.pipe_length || 0).toFixed(2)} m`);
            addRight('Promjer cijevi', `${(report.pipe_diameter || 0).toFixed(2)} m`);
            addRight('Nagib', `${(report.pipeline_slope || 0).toFixed(2)} %`);
        }
    } else { // Air
        addRight('Tlak na početku', `${(report.pressure_start || 0).toFixed(2)} mbar`);
        addRight('Tlak na kraju', `${(report.pressure_end || 0).toFixed(2)} mbar`);
        addRight('Pad tlaka', `${(report.pressure_start! - report.pressure_end!).toFixed(2)} mbar`);
    }

    // Sync Y
    currentY = Math.max(leftY, rightY) + 10;

    // --- Results / Calculations ---
    leftY = currentY;
    rightY = currentY;

    if (report.type_id === 1) {
        // Water Results
        const totalArea = calc.calculateTotalWettedArea(
            calc.calculateWettedPipeSurface(report.draft_id!, report.pipe_diameter!, report.pipe_length!),
            calc.calculateWettedShaftSurface(report.draft_id!, report.material_type_id!, report.water_height!, report.pane_diameter!, report.pane_width!, report.pane_length!)
        );
        addLeft('Ukupna omočena površina', `${totalArea.toFixed(2)} m²`);

        const criteria = calc.getCriteria(report.draft_id!);
        const allowedLoss = calc.calculateAllowedLossL(criteria, totalArea);
        addLeft('Dozvoljeni gubitak', `${allowedLoss.toFixed(2)} l`);

        const waterLoss = calc.calculateWaterLoss(report.water_height_start!, report.water_height_end!);
        addRight('Gubitak vode', `${waterLoss.toFixed(2)} mm`);

        const volLoss = calc.calculateWaterVolumeLoss(waterLoss, report.material_type_id!, report.pane_diameter, report.pane_width, report.pane_length);
        addRight('ΔV', `${volLoss.toFixed(4)} l`);

        const result = calc.calculateResult(volLoss, totalArea);
        addRight('Izmjereni gubitak', `${result.toFixed(2)} l/m²`);
    }

    currentY = Math.max(leftY, rightY) + 10;

    // Air Table Image
    if (report.type_id === 2 && tableImg) {
        doc.addImage(tableImg, 'PNG', 20, currentY, 170, 60);
        currentY += 70;
    }

    // --- Remarks ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Napomena:', 20, currentY);
    if (report.remark) {
        doc.setFont('helvetica', 'bold');
        doc.text(report.remark, 20, currentY + 5, { maxWidth: 80 });
    }

    doc.setFont('helvetica', 'normal');
    doc.text('Odstupanje od norme:', 110, currentY);
    if (report.deviation) {
        doc.setFont('helvetica', 'bold');
        doc.text(report.deviation, 110, currentY + 5, { maxWidth: 80 });
    }

    // --- Footer ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Izradio: ___________________', pageWidth / 2, pageHeight - 20, { align: 'center' });
};


