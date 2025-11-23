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
    for (let i = 0; i < reports.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        await renderReportPage(doc, reports[i]);
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
const renderReportPage = async (doc: jsPDF, report: Partial<ReportForm>) => {
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

    // Company Info (Center)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GRAĐEVINSKI LABORATORIJ', pageWidth / 2, 20, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('ANTE-INŽENJERSTVO d.o.o.', pageWidth / 2, 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Petra Krešimira 19 ; 21 266 Zmijavci', pageWidth / 2, 30, { align: 'center' });
    doc.text('www.ante-inzenjerstvo.hr', pageWidth / 2, 35, { align: 'center' });

    // Vertical Lines
    doc.setDrawColor(0);
    doc.line(60, 15, 60, 45); // Left of center
    doc.line(150, 15, 150, 45); // Right of center

    // Title (Right)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const title = report.type_id === 1
        ? 'ISPITIVANJE VODONEPROPUSNOSTI\nCJEVOVODA CIJEVI I\nKONTROLNA OKNA\nPREMA HRN EN\n1610:2015 - L'
        : 'ISPITIVANJE VODONEPROPUSNOSTI\nCJEVOVODA METODA ZRAK\nPREMA HRN EN\n1610:2015 - L';
    doc.text(title, 155, 20);

    // Meta Info (Far Right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1', pageWidth - 20, 20, { align: 'right' }); // Page number placeholder
    doc.setFont('helvetica', 'normal');
    doc.text('OB 21-2', pageWidth - 20, 25, { align: 'right' });
    doc.text('Izdanje: 2', pageWidth - 20, 30, { align: 'right' });
    doc.text(`Datum: ${new Date().toLocaleDateString('hr-HR')}`, pageWidth - 20, 35, { align: 'right' });

    // --- Status Banner ---
    const satisfies = report.satisfies;
    const statusText = satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA';
    const statusColor = satisfies ? '#008000' : '#FF0000';

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor);
    doc.text(statusText, pageWidth / 2, 55, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset

    // --- General Info ---
    let currentY = 70;
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
    const drawRow = (key: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'normal');
        doc.text(key + ':', x, y);
        doc.setFont('helvetica', 'bold');
        doc.text(value, x + 40, y);
    };

    const addLeft = (k: string, v: string) => { drawRow(k, v, leftX, leftY); leftY += 5; };
    const addRight = (k: string, v: string) => { drawRow(k, v, rightX, rightY); rightY += 5; };

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
        if (report.draft_id !== 2) { // Not Schema C (Pipe Only) - Schema C uses pane_diameter for main pipe
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
    // Show pipe info for B(3), C(2), E(5)
    if ([2, 3, 5].includes(report.draft_id || 0)) {
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
        // Right Column - Air specific measurements
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

        // Sync Y for table
        currentY = Math.max(leftY, rightY) + 10;

        // Draw EN 1610 Table
        const tableY = currentY;
        const tableWidth = 170;
        const tableX = (pageWidth - tableWidth) / 2;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Main headers
        doc.text('SUHE BETONSKE CIJEVI', tableX + 40, tableY, { align: 'center' });
        doc.text('OSTALE CIJEVI', tableX + 130, tableY, { align: 'center' });

        // Table data
        doc.setFontSize(7);
        let y = tableY + 4;

        // Headers row 1 - Postupak ispitivanja
        doc.text('Postupak ispitivanja', tableX + 20, y, { align: 'center' });
        let x = tableX + 40;
        ['LA', 'LB', 'LC', 'LD'].forEach(m => {
            doc.text(m, x + 6.5, y, { align: 'center' });
            x += 13;
        });
        doc.text('Postupak ispitivanja', tableX + 90, y, { align: 'center' });
        x = tableX + 130;
        ['LA', 'LB', 'LC', 'LD'].forEach(m => {
            doc.text(m, x + 6.5, y, { align: 'center' });
            x += 13;
        });

        // Headers row 2 - ispitni tlak
        y += 4;
        doc.text('ispitni tlak', tableX + 20, y, { align: 'center' });
        x = tableX + 40;
        ['10', '50', '100', '200'].forEach(p => {
            doc.text(p, x + 6.5, y, { align: 'center' });
            x += 13;
        });
        doc.text('ispitni tlak', tableX + 90, y, { align: 'center' });
        x = tableX + 130;
        ['10', '50', '100', '200'].forEach(p => {
            doc.text(p, x + 6.5, y, { align: 'center' });
            x += 13;
        });

        // Headers row 3 - dozvoljeni pad tlaka
        y += 4;
        doc.text('dozvoljeni pad', tableX + 20, y, { align: 'center' });
        doc.text('tlaka', tableX + 20, y + 3, { align: 'center' });
        x = tableX + 40;
        ['2,5', '10', '15', '15'].forEach(d => {
            doc.text(d, x + 6.5, y + 1.5, { align: 'center' });
            x += 13;
        });
        doc.text('dozvoljeni pad', tableX + 90, y, { align: 'center' });
        doc.text('tlaka', tableX + 90, y + 3, { align: 'center' });
        x = tableX + 130;
        ['2,5', '10', '15', '15'].forEach(d => {
            doc.text(d, x + 6.5, y + 1.5, { align: 'center' });
            x += 13;
        });

        // Data rows
        y += 7;
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
            doc.text(row.d, tableX + 20, y, { align: 'center' });
            x = tableX + 40;
            row.c.forEach((t: number) => {
                doc.text(t.toString(), x + 6.5, y, { align: 'center' });
                x += 13;
            });
            doc.text(row.d, tableX + 90, y, { align: 'center' });
            x = tableX + 130;
            row.o.forEach((t: number) => {
                doc.text(t.toString(), x + 6.5, y, { align: 'center' });
                x += 13;
            });
            y += 4;
        });

        // Draw table borders
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.rect(tableX, tableY - 2, tableWidth, y - tableY + 2);

        // Vertical lines
        const colWidths = [40, 13, 13, 13, 13, 40, 13, 13, 13, 13];
        x = tableX;
        for (let i = 0; i < colWidths.length; i++) {
            x += colWidths[i];
            if (i !== colWidths.length - 1) {
                doc.line(x, tableY - 2, x, y);
            }
        }

        // Horizontal lines
        doc.line(tableX, tableY + 2, tableX + tableWidth, tableY + 2);
        doc.line(tableX, tableY + 6, tableX + tableWidth, tableY + 6);
        doc.line(tableX, tableY + 13, tableX + tableWidth, tableY + 13);
        doc.line(tableX, tableY + 17, tableX + tableWidth, tableY + 17);

        currentY = y + 5;
        leftY = currentY;
        rightY = currentY;
    }

    // --- Footer ---
    currentY = Math.max(leftY, rightY) + 20;

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
    doc.text('Izradio: Admin Admin', pageWidth / 2, pageHeight - 20, { align: 'center' }); // Placeholder for user name
};
