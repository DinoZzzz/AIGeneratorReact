import jsPDF from 'jspdf';
import type { ReportForm, Profile } from '../types';
import * as calc from './calculations/report';

/**
 * PDF Generator for Water and Air Method Reports
 * Generates PDF reports with Croatian character support
 */

// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

// Helper to render Croatian text with special characters
const renderCroatianText = (doc: jsPDF, text: string, x: number, y: number, options?: any) => {
    // For characters that need special handling: č, ć, š, ž, đ, Č, Ć, Š, Ž, Đ
    const specialChars: Record<string, { base: string, hasHacek: boolean, hasStroke: boolean }> = {
        'č': { base: 'c', hasHacek: true, hasStroke: false },
        'ć': { base: 'c', hasHacek: true, hasStroke: false },
        'š': { base: 's', hasHacek: true, hasStroke: false },
        'ž': { base: 'z', hasHacek: true, hasStroke: false },
        'đ': { base: 'd', hasHacek: false, hasStroke: true },
        'Č': { base: 'C', hasHacek: true, hasStroke: false },
        'Ć': { base: 'C', hasHacek: true, hasStroke: false },
        'Š': { base: 'S', hasHacek: true, hasStroke: false },
        'Ž': { base: 'Z', hasHacek: true, hasStroke: false },
        'Đ': { base: 'D', hasHacek: false, hasStroke: true }
    };

    const hasSpecialChars = /[čćšžđČĆŠŽĐ]/.test(text);

    if (!hasSpecialChars || options?.align === 'center' || options?.align === 'right') {
        // For centered/right-aligned or text without special chars, use simple replacement
        const cleanText = text.replace(/[čćšžđČĆŠŽĐ]/g, (match) => specialChars[match]?.base || match);
        doc.text(cleanText, x, y, options);
        return;
    }

    // For left-aligned text with special chars, render character by character
    const currentFontSize = doc.getFontSize();
    const currentLineWidth = 0.1; // Save current line width
    let currentX = x;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const special = specialChars[char];

        if (special) {
            doc.text(special.base, currentX, y);
            const charWidth = doc.getTextWidth(special.base);

            // Draw hacek (ˇ) for č, ć, š, ž
            if (special.hasHacek) {
                const fontSize = doc.getFontSize();
                // Position the hacek directly above the character
                const hacekBaseY = y - fontSize * 0.22;
                const hacekX = currentX + charWidth / 2;
                doc.setLineWidth(0.3);
                // Draw a small v-shape pointing down (like ˇ)
                doc.line(hacekX - 0.5, hacekBaseY - 0.5, hacekX, hacekBaseY);
                doc.line(hacekX, hacekBaseY, hacekX + 0.5, hacekBaseY - 0.5);
                doc.setLineWidth(currentLineWidth); // Restore line width
            }

            // Draw stroke for đ
            if (special.hasStroke) {
                doc.setLineWidth(0.3);
                doc.line(currentX + 0.3, y - currentFontSize * 0.3, currentX + charWidth - 0.3, y - currentFontSize * 0.3);
                doc.setLineWidth(currentLineWidth); // Restore line width
            }

            currentX += charWidth;
        } else {
            doc.text(char, currentX, y);
            currentX += doc.getTextWidth(char);
        }
    }
};

export const generatePDF = async (report: Partial<ReportForm>, userProfile?: Profile) => {
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        compress: true
    });
    await renderReportPage(doc, report, userProfile, 1, 1);
    doc.save(`report_${report.id || 'new'}.pdf`);
};

export const generateBulkPDF = async (reports: Partial<ReportForm>[], filename: string = 'reports_bundle.pdf', userProfile?: Profile) => {
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        compress: true
    });
    const totalPages = reports.length;
    for (let i = 0; i < reports.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        await renderReportPage(doc, reports[i], userProfile, i + 1, totalPages);
    }
    doc.save(filename);
};

// Helper to get scheme name
const getSchemeName = (id: number) => {
    const names = {
        1: 'Shema A - Ispitivanje okna',
        2: 'Shema C - Ispitivanje cijelovoda',
        3: 'Shema B - Ispitivanje okna i cijelovoda',
        4: 'Shema D - Ispitivanje slivnika',
        5: 'Shema E - Ispitivanje slivnika i cijelovoda'
    };
    return names[id as keyof typeof names] || 'Nepoznata shema';
};

// Extracted rendering logic
const renderReportPage = async (doc: jsPDF, report: Partial<ReportForm>, userProfile?: Profile, pageNum: number = 1, totalPages: number = 1) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load Assets
    let logoImg, sketchImg;
    try {
        logoImg = await loadImage('/assets/ai_icon.png');
        const schemeNum = report.draft_id || 1;
        sketchImg = await loadImage(`/assets/Scheme${schemeNum}.PNG`);
    } catch (e) {
        console.warn('Failed to load some images', e);
    }

    // --- Header ---
    // Logo (Left)
    if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 15, 35, 35);
    }

    // Company Info (Center) - centered between the two vertical lines (60 and 135)
    const centerX = (60 + 135) / 2; // Center between the two lines
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    // Using D with stroke as workaround for Đ since standard fonts don't support it
    const fullText = 'GRAĐEVINSKI LABORATORIJ';
    const textWidth = doc.getTextWidth(fullText.replace('Đ', 'D'));
    const startX = centerX - (textWidth / 2);

    doc.text('GRA', startX, 20);
    const graWidth = doc.getTextWidth('GRA');
    doc.text('D', startX + graWidth, 20);
    const dWidth = doc.getTextWidth('D');
    // Draw the stroke through D
    doc.setLineWidth(0.3);
    doc.line(startX + graWidth + 0.3, 19, startX + graWidth + dWidth - 0.3, 19);
    doc.text('EVINSKI LABORATORIJ', startX + graWidth + dWidth, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ANTE-INŽENJERSTVO d.o.o.', centerX, 26, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Petra Krešimira 19 ; 21 266 Zmijavci', centerX, 32, { align: 'center' });
    doc.text('www.ante-inzenjerstvo.hr', centerX, 37, { align: 'center' });

    // Vertical Lines
    doc.setDrawColor(0);
    doc.line(60, 15, 60, 50); // Left of center
    doc.line(135, 15, 135, 50); // Right of center

    // Title (Right) - Top section
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const title = report.type_id === 1
        ? 'ISPITIVANJE\nVODONEPROPUSNOSTI\nCJEVOVODA CIJEVI I\nKONTROLNA OKNA\nPREMA HRN EN\n1610:2015 - L'
        : 'ISPITIVANJE\nVODONEPROPUSNOSTI\nCJEVOVODA\nMETODA ZRAK\nPREMA HRN EN\n1610:2015 - L';

    const titleLines = title.split('\n');
    let titleY = 17;
    titleLines.forEach(line => {
        doc.text(line, 138, titleY, { align: 'left' });
        titleY += 3.5;
    });

    // Meta Info (Far Right) - Separate column
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Stranica: ${pageNum}/${totalPages}`, pageWidth - 15, 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('OB 21-2', pageWidth - 15, 22, { align: 'right' });
    doc.text('Izdanje: 2', pageWidth - 15, 27, { align: 'right' });
    doc.text(`Datum: ${new Date().toLocaleDateString('hr-HR')}`, pageWidth - 15, 32, { align: 'right' });

    // --- Status Banner ---
    const satisfies = report.satisfies;
    const statusText = satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA';
    const statusColor = satisfies ? '#008000' : '#FF0000';

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor);
    doc.text(statusText, pageWidth / 2, 60, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset

    // --- General Info ---
    let currentY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left side
    doc.text(`Temperatura: ${report.temperature} °C`, 40, currentY);
    doc.text(`Datum ispitivanja: ${report.examination_date || '-'}`, 40, currentY + 5);

    // Right side (Sketch label)
    const schemeName = getSchemeName(report.draft_id || 1);
    doc.text(`Skica:  ${schemeName}`, 100, currentY);

    // Sketch Image
    if (sketchImg) {
        const maxWidth = 90;
        const maxHeight = 60;
        const ratio = sketchImg.width / sketchImg.height;
        let w = maxWidth;
        let h = w / ratio;
        if (h > maxHeight) {
            h = maxHeight;
            w = h * ratio;
        }
        // Center the image roughly
        doc.addImage(sketchImg, 'PNG', (pageWidth - w) / 2, currentY + 15, w, h);
        currentY += 15 + h + 10;
    } else {
        currentY += 40;
    }

    // --- Input Data Section ---
    const leftX = 40;
    const rightX = 120;
    let leftY = currentY;
    let rightY = currentY;

    // Helper for rows
    const drawLeftRow = (key: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'normal');
        renderCroatianText(doc, key + ':', x, y);
        doc.setFont('helvetica', 'bold');
        renderCroatianText(doc, value, x + 55, y);
    };

    const drawRightRow = (key: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'normal');
        renderCroatianText(doc, key + ':', x, y);
        doc.setFont('helvetica', 'bold');
        renderCroatianText(doc, value, x + 60, y);
    };

    const addLeft = (k: string, v: string) => { drawLeftRow(k, v, leftX, leftY); leftY += 5; };
    const addRight = (k: string, v: string) => { drawRightRow(k, v, rightX, rightY); rightY += 5; };

    // --- Left Column Inputs ---
    addLeft('Dionica', report.dionica || '-');

    const isGully = report.draft_id === 4 || report.draft_id === 5;
    const typeLabel = isGully ? 'Tip slivnika' : 'Tip okna';
    const materialLabel = isGully ? 'Materijal slivnika' : 'Materijal okna';
    const widthLabel = isGully ? 'Širina slivnika' : 'Širina okna';
    const lengthLabel = isGully ? 'Dužina slivnika' : 'Dužina okna';
    const heightLabel = isGully ? 'Visina slivnika' : 'Visina okna';
    const diameterLabel = isGully ? 'Promjer slivnika' : 'Promjer okna';

    addLeft(typeLabel, report.material_type_id === 1 ? 'Okrugli' : 'Kvadratni');

    // Material Name Logic
    let materialName = '-';
    if (report.type_id === 2) { // Air Method
        const airMats: Record<number, string> = { 1: 'PVC', 2: 'Betonska' };
        materialName = airMats[report.pipe_material_id || 1] || 'PVC';
    } else if (report.material_type_id === 1) { // Water Method - Round
        const mats = ['PVC', 'PE', 'PEHD', 'GRP'];
        materialName = mats[(report.pane_material_id || 1) - 1] || 'PVC';
    } else {
        materialName = 'Armirano betonska';
    }
    addLeft(materialLabel, materialName);

    // Dimensions
    if (report.material_type_id === 1) { // Round
        // Only show "Visina ro" for Water Method (type_id === 1)
        if (report.type_id === 1 && report.draft_id !== 2) { // Not Schema C (Pipe Only) - Schema C uses pane_diameter for main pipe
            addLeft('Visina ro', `${(report.ro_height || 0).toFixed(2)} cm`);
        }

        if (report.draft_id === 2) {
            addLeft('Promjer gl. cijevi', `${(report.pane_diameter || 0).toFixed(0)} mm`);
        } else {
            addLeft(diameterLabel, `${(report.pane_diameter || 0).toFixed(0)} mm`);
        }
    } else { // Rectangular
        if (report.draft_id === 2) {
            // Schema C Rectangular uses Channel dimensions
            addLeft('Širina kanala', `${(report.pane_width || 0).toFixed(2)} cm`);
            addLeft('Dužina kanala', `${(report.pane_length || 0).toFixed(2)} cm`);
            addLeft('Visina kanala', `${(report.pane_height || 0).toFixed(2)} cm`);
        } else {
            addLeft(widthLabel, `${(report.pane_width || 0).toFixed(2)} cm`);
            addLeft(lengthLabel, `${(report.pane_length || 0).toFixed(2)} cm`);
            addLeft(heightLabel, `${(report.pane_height || 0).toFixed(2)} cm`);
        }
    }


    // Water Method specific
    if (report.type_id === 1) {
        addLeft('Visina vode', `${(report.water_height || 0).toFixed(2)} cm`);
    }

    // Air Method specific
    if (report.type_id === 2) {
        const procNames: Record<number, string> = { 1: 'LA', 2: 'LB', 3: 'LC', 4: 'LD' };
        addLeft('Metoda ispitivanja', procNames[report.examination_procedure_id || 1] || 'LA');
    }

    addLeft('Trajanje', report.examination_duration || '-');

    // --- Right Column Inputs (Pipe Info) ---
    // Show pipe info for B(3), C(2), E(5) - only for Water Method
    if (report.type_id === 1 && [2, 3, 5].includes(report.draft_id || 0)) {
        const pipeMats = ['PVC', 'PE', 'PEHD', 'GRP'];
        const pipeMatName = pipeMats[(report.pipe_material_id || 1) - 1] || 'PVC';

        addRight('Materijal cijevi', pipeMatName);
        addRight('Dužina cijevi', `${(report.pipe_length || 0).toFixed(2)} m`);
        addRight('Promjer cijevi', `${(report.pipe_diameter || 0).toFixed(0)} mm`);

        if ([4, 5].includes(report.draft_id || 0)) { // D or E
            addRight('Taložna visina', `${(report.depositional_height || 0).toFixed(2)} cm`);
        }

        addRight('Nagib', `${(report.pipeline_slope || 0).toFixed(2)} %`);
    }

    // For Air Method, show measurements in the right column
    if (report.type_id === 2) {
        const stabTime = report.stabilization_time || '00:00';
        addRight('Vrijeme stabilizacije', stabTime.toString());

        const examDuration = report.examination_duration || '00:00';
        addRight('Trajanje', examDuration.toString());

        // Format required test time (convert minutes to mm:ss)
        const testTimeMins = report.required_test_time || 0;
        const testMins = Math.floor(testTimeMins);
        const testSecs = Math.round((testTimeMins - testMins) * 60);
        addRight('Vrijeme ispitivanja', `${testMins}m ${testSecs.toString().padStart(2, '0')}s`);

        addRight('Tlak na početku', `${(report.pressure_start || 0).toFixed(2)} mbar`);
        addRight('Tlak na kraju', `${(report.pressure_end || 0).toFixed(2)} mbar`);
        addRight('Pad tlaka', `${(report.pressure_loss || 0).toFixed(2)} mbar`);
    }

    // Sync Y for Results
    currentY = Math.max(leftY, rightY) + 10;

    // --- Results Section ---
    leftY = currentY;
    rightY = currentY;

    if (report.type_id === 1) { // Water Results
        // Convert units for calculation (mm/cm -> m)
        const r = {
            ...report,
            pane_diameter: (report.pane_diameter || 0) / 1000,
            pipe_diameter: (report.pipe_diameter || 0) / 1000,
            pane_width: (report.pane_width || 0) / 100,
            pane_length: (report.pane_length || 0) / 100,
            pane_height: (report.pane_height || 0) / 100,
            water_height: (report.water_height || 0) / 100,
            ro_height: (report.ro_height || 0) / 100,
            depositional_height: (report.depositional_height || 0) // m
        };

        const draftId = report.draft_id || 1;

        // Calculate values
        const wettedShaft = calc.calculateWettedShaftSurface(draftId, report.material_type_id!, r.water_height!, r.pane_diameter!, r.pane_width!, r.pane_length!);

        let wettedPipe = 0;
        if (draftId === 2) {
            // Schema C: wettedPipeSurface is ONLY the secondary pipe. Main pipe/Channel is wettedShaft.
            wettedPipe = calc.calculateWettedPipeSurface(draftId, r.pipe_diameter!, report.pipe_length!);
        } else {
            wettedPipe = calc.calculateWettedPipeSurface(draftId, r.pipe_diameter!, report.pipe_length!);
        }

        const totalArea = wettedShaft + wettedPipe;
        const criteria = calc.getCriteria(draftId);
        const allowedLossL = calc.calculateAllowedLossL(criteria, totalArea);
        const allowedLossMm = calc.calculateAllowedLossMm(allowedLossL, report.material_type_id!, r.pane_diameter!, r.pane_width!, r.pane_length!);

        const waterLoss = calc.calculateWaterLoss(report.water_height_start!, report.water_height_end!);
        const volLoss = calc.calculateWaterVolumeLoss(waterLoss, report.material_type_id!, r.pane_diameter!, r.pane_width!, r.pane_length!);
        const result = calc.calculateResult(volLoss, totalArea);

        const hydrostaticHeight = calc.calculateHydrostaticHeight(draftId, r.water_height!, r.pipe_diameter!, r.depositional_height!);

        // Display Results (Left Column)
        if (draftId === 1 || draftId === 3 || draftId === 4 || draftId === 5) {
            const label = (draftId === 4 || draftId === 5) ? 'Omoćena površina slivnika' : 'Omoćena površina okna';
            addLeft(label, `${wettedShaft.toFixed(2)} m²`);
        } else if (draftId === 2) {
            if (report.material_type_id === 2) {
                addLeft('Omoćena površina kanala', `${wettedShaft.toFixed(2)} m²`);
            } else {
                addLeft('Omoćena površina okna', `${wettedShaft.toFixed(2)} m²`);
            }
        }

        if ([2, 3, 5].includes(draftId)) {
            addLeft('Omoćena površina cijevi', `${wettedPipe.toFixed(2)} m²`);
        }

        addLeft('Ukupna omočena površina', `${totalArea.toFixed(2)} m²`);
        addLeft('Dozvoljeni gubitak', `${allowedLossL.toFixed(2)} l`);
        addLeft('Dozvoljeni gubitak', `${allowedLossMm.toFixed(2)} mm`);

        // Display Results (Right Column)
        addRight('Visina vode u oknu na početku', `${(report.water_height_start || 0).toFixed(2)} mm`);
        addRight('Visina vode u oknu na kraju', `${(report.water_height_end || 0).toFixed(2)} mm`);

        if ([2, 3].includes(draftId) && hydrostaticHeight > 0) {
            addRight('Hidrostatska visina', `${(hydrostaticHeight * 100).toFixed(0)} cm`);
        }

        addRight('Gubitak vode', `${waterLoss.toFixed(2)} mm`);
        addRight('ΔV', `${volLoss.toFixed(4)} l`);
        addRight('Izmjereni gubitak', `${result.toFixed(2)} l/m²`);
    } else if (report.type_id === 2) { // Air Method Results
        // Air method measurements are now in the input section above
        // Sync Y for table
        currentY = Math.max(leftY, rightY) + 5;

        // Draw EN 1610 Table
        const tableY = currentY;
        const tableWidth = 170;
        const tableX = (pageWidth - tableWidth) / 2;

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);

        // Main category headers
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('SUHE BETONSKE CIJEVI', tableX + 42.5, tableY + 2, { align: 'center' });
        doc.text('OSTALE CIJEVI', tableX + 127.5, tableY + 2, { align: 'center' });

        // Column configuration: DN(17) + 4 methods(13 each) + gap(32) + DN(17) + 4 methods(13 each)
        const colWidths = [17, 13, 13, 13, 13, 32, 13, 13, 13, 13];

        let y = tableY + 6;
        doc.setFontSize(7);

        // First header row - Methods
        doc.text('DN', tableX + 8.5, y, { align: 'center' });
        doc.text('LA', tableX + 23.5, y, { align: 'center' });
        doc.text('LB', tableX + 36.5, y, { align: 'center' });
        doc.text('LC', tableX + 49.5, y, { align: 'center' });
        doc.text('LD', tableX + 62.5, y, { align: 'center' });

        doc.text('DN', tableX + 93.5, y, { align: 'center' });
        doc.text('LA', tableX + 106.5, y, { align: 'center' });
        doc.text('LB', tableX + 119.5, y, { align: 'center' });
        doc.text('LC', tableX + 132.5, y, { align: 'center' });
        doc.text('LD', tableX + 145.5, y, { align: 'center' });

        // Second header row - Pressure (mbar)
        y += 4;
        doc.text('(mm)', tableX + 8.5, y, { align: 'center' });
        doc.text('10', tableX + 23.5, y, { align: 'center' });
        doc.text('50', tableX + 36.5, y, { align: 'center' });
        doc.text('100', tableX + 49.5, y, { align: 'center' });
        doc.text('200', tableX + 62.5, y, { align: 'center' });

        doc.text('(mm)', tableX + 93.5, y, { align: 'center' });
        doc.text('10', tableX + 106.5, y, { align: 'center' });
        doc.text('50', tableX + 119.5, y, { align: 'center' });
        doc.text('100', tableX + 132.5, y, { align: 'center' });
        doc.text('200', tableX + 145.5, y, { align: 'center' });

        // Third header row - Allowed pressure drop
        y += 4;
        doc.text('mbar', tableX + 8.5, y, { align: 'center' });
        doc.text('2,5', tableX + 23.5, y, { align: 'center' });
        doc.text('10', tableX + 36.5, y, { align: 'center' });
        doc.text('15', tableX + 49.5, y, { align: 'center' });
        doc.text('15', tableX + 62.5, y, { align: 'center' });

        doc.text('mbar', tableX + 93.5, y, { align: 'center' });
        doc.text('2,5', tableX + 106.5, y, { align: 'center' });
        doc.text('10', tableX + 119.5, y, { align: 'center' });
        doc.text('15', tableX + 132.5, y, { align: 'center' });
        doc.text('15', tableX + 145.5, y, { align: 'center' });

        // Data rows
        y += 5;
        doc.setFont('helvetica', 'normal');
        const rows = [
            { d: '100', c: [5, 4, 3, 1.5], o: [5, 4, 3, 1.5] },
            { d: '200', c: [5, 4, 3, 1.5], o: [5, 4, 3, 1.5] },
            { d: '300', c: [5, 4, 3, 1.5], o: [7, 6, 4, 2] },
            { d: '400', c: [7, 6, 4, 2], o: [10, 7, 5, 2.5] },
            { d: '600', c: [11, 8, 6, 3], o: [14, 11, 6, 4] },
            { d: '800', c: [14, 11, 8, 4], o: [19, 15, 11, 5] },
            { d: '1000', c: [18, 14, 10, 5], o: [24, 19, 14, 7] }
        ];

        rows.forEach(row => {
            doc.text(row.d, tableX + 8.5, y, { align: 'center' });
            doc.text(row.c[0].toString(), tableX + 23.5, y, { align: 'center' });
            doc.text(row.c[1].toString(), tableX + 36.5, y, { align: 'center' });
            doc.text(row.c[2].toString(), tableX + 49.5, y, { align: 'center' });
            doc.text(row.c[3].toString(), tableX + 62.5, y, { align: 'center' });

            doc.text(row.d, tableX + 93.5, y, { align: 'center' });
            doc.text(row.o[0].toString(), tableX + 106.5, y, { align: 'center' });
            doc.text(row.o[1].toString(), tableX + 119.5, y, { align: 'center' });
            doc.text(row.o[2].toString(), tableX + 132.5, y, { align: 'center' });
            doc.text(row.o[3].toString(), tableX + 145.5, y, { align: 'center' });

            y += 4;
        });

        // Draw all borders
        const tableHeight = y - tableY - 2;

        // Outer border
        doc.setLineWidth(0.2);
        doc.rect(tableX, tableY, tableWidth, tableHeight);

        // Vertical lines
        let xPos = tableX;
        for (let i = 0; i < colWidths.length; i++) {
            xPos += colWidths[i];
            if (i < colWidths.length - 1) {
                doc.line(xPos, tableY, xPos, tableY + tableHeight);
            }
        }

        // Horizontal lines
        doc.line(tableX, tableY + 4, tableX + tableWidth, tableY + 4); // After main header
        doc.line(tableX, tableY + 8, tableX + tableWidth, tableY + 8); // After methods
        doc.line(tableX, tableY + 12, tableX + tableWidth, tableY + 12); // After pressure
        doc.setLineWidth(0.25);
        doc.line(tableX, tableY + 16, tableX + tableWidth, tableY + 16); // Before data (thicker)

        // Thin lines between data rows
        doc.setLineWidth(0.1);
        let rowLine = tableY + 20;
        for (let i = 0; i < rows.length - 1; i++) {
            doc.line(tableX, rowLine, tableX + tableWidth, rowLine);
            rowLine += 4;
        }

        currentY = y + 3;
        leftY = currentY;
        rightY = currentY;
    }

    // --- Footer ---
    currentY = Math.max(leftY, rightY) + 5;

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

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const displayName = userProfile ? `${userProfile.name} ${userProfile.last_name}` : 'Nepoznat korisnik';
    doc.text(`Izradio: ${displayName}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
};
