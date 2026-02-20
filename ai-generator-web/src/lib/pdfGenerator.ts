import jsPDF from 'jspdf';
import type { ReportForm, Profile, Material, SchemeImage } from '../types';
import * as calc from './calculations/report';
import { RobotoRegular, RobotoBold } from './fonts/roboto';

/**
 * PDF Generator for Water and Air Method Reports
 * Generates PDF reports with Croatian character support using Roboto font
 */

// Flag to track if fonts are registered
let fontsRegistered = false;

// Register Roboto fonts with jsPDF (only once)
const registerFonts = (doc: jsPDF) => {
    if (!fontsRegistered) {
        // Add Roboto Regular
        doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

        // Add Roboto Bold
        doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

        fontsRegistered = true;
    }
    // Set Roboto as default font
    doc.setFont('Roboto');
};

// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (/^https?:\/\//i.test(src)) {
            img.crossOrigin = 'anonymous';
        }
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

const FORM_ISSUE_DATE = '01.05.2020.';

const LEGACY_AIR_DRAFT_TO_SCHEME_NUMBER: Record<number, number> = {
    2: 1, // Pipe only
    3: 2, // Shaft + pipe
    1: 3 // Shaft only
};

const AIR_DRAFT_TO_LETTER: Record<number, 'F' | 'G' | 'H'> = {
    1: 'F', // Shaft only
    2: 'G', // Pipe only
    3: 'H' // Shaft + pipe
};

const getFallbackSchemeNumberForReport = (report: Partial<ReportForm>): number => {
    const draftId = Number(report.draft_id) || 1;
    if (Number(report.type_id) === 2) {
        return LEGACY_AIR_DRAFT_TO_SCHEME_NUMBER[draftId] || 1;
    }
    return draftId;
};

const getAirProcedureName = (report: Partial<ReportForm>): 'LA' | 'LB' | 'LC' | 'LD' => {
    const joinedName = report.examination_procedure?.name?.toUpperCase() || '';
    if (joinedName.includes('LB')) return 'LB';
    if (joinedName.includes('LC')) return 'LC';
    if (joinedName.includes('LD')) return 'LD';
    if (joinedName.includes('LA')) return 'LA';

    const procedureId = Number(report.examination_procedure_id) || 1;
    const idToName: Record<number, 'LA' | 'LB' | 'LC' | 'LD'> = {
        1: 'LA',
        2: 'LB',
        3: 'LC',
        4: 'LD'
    };
    return idToName[procedureId] || 'LA';
};

const getFallbackAirSchemeNameByLetter = (letter: 'F' | 'G' | 'H'): string => {
    const names: Record<'F' | 'G' | 'H', string> = {
        F: 'Shema F - Ispitivanje okna',
        G: 'Shema G - Ispitivanje cjevovoda',
        H: 'Shema H - Ispitivanje okna i cjevovoda'
    };
    return names[letter];
};

const getFallbackSchemeName = (report: Partial<ReportForm>): string => {
    if (Number(report.type_id) === 2) {
        const draftId = Number(report.draft_id) || 1;
        const procedureName = getAirProcedureName(report);
        if (procedureName === 'LA' || procedureName === 'LB') {
            const letter = AIR_DRAFT_TO_LETTER[draftId] || 'G';
            return getFallbackAirSchemeNameByLetter(letter);
        }

        const airSchemeNames: Record<number, string> = {
            1: 'Shema 1 - Ispitivanje cjevovoda',
            2: 'Shema 2 - Ispitivanje okna i cjevovoda',
            3: 'Shema 3 - Ispitivanje okna'
        };
        const schemeNumber = getFallbackSchemeNumberForReport(report);
        return airSchemeNames[schemeNumber] || 'Nepoznata shema';
    }

    const waterSchemeNames: Record<number, string> = {
        1: 'Shema A - Ispitivanje okna',
        2: 'Shema C - Ispitivanje cjevovoda',
        3: 'Shema B - Ispitivanje okna i cjevovoda',
        4: 'Shema D - Ispitivanje slivnika',
        5: 'Shema E - Ispitivanje slivnika i cjevovoda'
    };
    const draftId = Number(report.draft_id) || 1;
    return waterSchemeNames[draftId] || 'Nepoznata shema';
};

let materialsMapPromise: Promise<Map<number, string>> | null = null;

const getMaterialNamesMap = async (): Promise<Map<number, string>> => {
    if (!materialsMapPromise) {
        materialsMapPromise = (async () => {
            try {
                const { getLookupWithOfflineFallback } = await import('../lib/offlineLookupCache');
                const materials = await getLookupWithOfflineFallback<Material>('materials', 'id');
                return new Map<number, string>(
                    materials
                        .filter((material) => typeof material?.id === 'number' && typeof material?.name === 'string')
                        .map((material) => [material.id, material.name])
                );
            } catch {
                return new Map<number, string>();
            }
        })();
    }
    return materialsMapPromise;
};

let airSchemesPromise: Promise<SchemeImage[]> | null = null;

const getAirSchemes = async (): Promise<SchemeImage[]> => {
    if (!airSchemesPromise) {
        airSchemesPromise = (async () => {
            try {
                const { getSchemeImages } = await import('../services/schemeService');
                const schemes = await getSchemeImages();
                return schemes.filter((scheme) => scheme.method_type === 'air');
            } catch {
                return [];
            }
        })();
    }
    return airSchemesPromise;
};

const matchesAirSchemeLetter = (schemeName: string, letter: 'F' | 'G' | 'H'): boolean => {
    const normalizedName = schemeName.toLowerCase().trim();
    const normalizedLetter = letter.toLowerCase();
    return (
        normalizedName === normalizedLetter ||
        normalizedName.includes(`shema ${normalizedLetter}`) ||
        normalizedName.includes(`scheme ${normalizedLetter}`) ||
        normalizedName.includes(`schema ${normalizedLetter}`)
    );
};

interface ResolvedAirSchemeSelection {
    schemeNumber: number;
    fallbackName: string;
}

const resolveAirSchemeSelection = async (report: Partial<ReportForm>): Promise<ResolvedAirSchemeSelection> => {
    const draftId = Number(report.draft_id) || 1;
    const fallbackSchemeNumber = LEGACY_AIR_DRAFT_TO_SCHEME_NUMBER[draftId] || 1;
    const procedureName = getAirProcedureName(report);

    if (procedureName !== 'LA' && procedureName !== 'LB') {
        return {
            schemeNumber: fallbackSchemeNumber,
            fallbackName: getFallbackSchemeName(report)
        };
    }

    const targetLetter = AIR_DRAFT_TO_LETTER[draftId] || 'G';
    const airSchemes = await getAirSchemes();
    const matchedScheme = airSchemes.find((scheme) => matchesAirSchemeLetter(scheme.name || '', targetLetter));

    return {
        schemeNumber: matchedScheme?.scheme_number || fallbackSchemeNumber,
        fallbackName: getFallbackAirSchemeNameByLetter(targetLetter)
    };
};

export const generatePDF = async (report: Partial<ReportForm>, userProfile?: Profile) => {
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        compress: true
    });
    registerFonts(doc);
    await renderReportPage(doc, report, userProfile, 1, 1);
    doc.save(`report_${report.id || 'new'}.pdf`);
};

export const generateBulkPDF = async (reports: Partial<ReportForm>[], filename: string = 'reports_bundle.pdf', userProfile?: Profile) => {
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        compress: true
    });
    registerFonts(doc);
    const totalPages = reports.length;
    for (let i = 0; i < reports.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        await renderReportPage(doc, reports[i], userProfile, i + 1, totalPages);
    }
    doc.save(filename);
};

export const generateBulkPDFAsBlob = async (reports: Partial<ReportForm>[], userProfile?: Profile): Promise<Blob> => {
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        compress: true
    });
    registerFonts(doc);
    const totalPages = reports.length;
    for (let i = 0; i < reports.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        await renderReportPage(doc, reports[i], userProfile, i + 1, totalPages);
    }
    return doc.output('blob');
};

// Extracted rendering logic
const renderReportPage = async (doc: jsPDF, report: Partial<ReportForm>, userProfile?: Profile, pageNum: number = 1, totalPages: number = 1) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const reportTypeId = Number(report.type_id);
    const methodType: 'water' | 'air' | undefined = reportTypeId === 1
        ? 'water'
        : reportTypeId === 2
            ? 'air'
            : undefined;

    // Load Assets
    let logoImg, sketchImg;
    let schemeName = getFallbackSchemeName(report);
    try {
        logoImg = await loadImage('/assets/ai_icon.png');
        let schemeNum = getFallbackSchemeNumberForReport(report);
        if (methodType === 'air') {
            const resolvedSelection = await resolveAirSchemeSelection(report);
            schemeNum = resolvedSelection.schemeNumber;
            schemeName = resolvedSelection.fallbackName;
        }

        // Try to get custom scheme image from admin settings, with method-aware fallback
        let schemeImageUrl: string;
        try {
            const { getSchemeImageUrl, getLocalSchemeAssetPath, getSchemeImage } = await import('../services/schemeService');
            try {
                const schemeRecord = methodType ? await getSchemeImage(schemeNum, methodType) : null;
                if (schemeRecord?.name) {
                    schemeName = schemeRecord.name;
                }
                schemeImageUrl = await getSchemeImageUrl(schemeNum, methodType);
            } catch {
                schemeImageUrl = getLocalSchemeAssetPath(schemeNum, methodType);
            }
        } catch {
            // Dynamic import itself failed — inline method-aware fallback
            if (methodType === 'air') {
                const airAssets: Record<number, string> = { 1: '/assets/Scheme6.PNG', 2: '/assets/Scheme8.png', 3: '/assets/Scheme7.png' };
                schemeImageUrl = airAssets[schemeNum] || '/assets/Scheme6.PNG';
            } else {
                schemeImageUrl = `/assets/Scheme${schemeNum}.PNG`;
            }
            console.warn('Failed to load schemeService, using local asset');
        }

        sketchImg = await loadImage(schemeImageUrl);
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
    doc.setFont('Roboto', 'normal');
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

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.text('ANTE-INŽENJERSTVO d.o.o.', centerX, 26, { align: 'center' });
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7);
    doc.text('Petra Krešimira 19 ; 21 266 Zmijavci', centerX, 32, { align: 'center' });
    doc.text('www.ante-inzenjerstvo.hr', centerX, 37, { align: 'center' });

    // Vertical Lines
    doc.setDrawColor(0);
    doc.line(60, 15, 60, 50); // Left of center
    doc.line(135, 15, 135, 50); // Right of center

    // Title (Right) - Top section
    doc.setFontSize(8);
    doc.setFont('Roboto', 'bold');
    const title = reportTypeId === 1
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
    doc.setFont('Roboto', 'bold');
    doc.text(`Stranica: ${pageNum}/${totalPages}`, pageWidth - 15, 17, { align: 'right' });
    doc.setFont('Roboto', 'normal');
    doc.text('OB 21-2', pageWidth - 15, 22, { align: 'right' });
    doc.text('Izdanje: 2', pageWidth - 15, 27, { align: 'right' });
    doc.text(`Datum obrasca: ${FORM_ISSUE_DATE}`, pageWidth - 15, 32, { align: 'right' });

    // --- Status Banner ---
    const satisfies = report.satisfies;
    const statusText = satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA';
    const statusColor = satisfies ? '#008000' : '#FF0000';

    doc.setFontSize(16);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(statusColor);
    doc.text(statusText, pageWidth / 2, 60, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset

    // --- General Info ---
    let currentY = 75;
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');

    // Left side
    doc.text(`Temperatura: ${report.temperature} °C`, 40, currentY);
    doc.text(`Datum ispitivanja: ${report.examination_date || '-'}`, 40, currentY + 5);

    // Right side (Sketch label)
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
    const leftX = 15;
    const leftValueX = 55; // Fixed position for left column values
    const rightLabelX = pageWidth / 2 + 5; // Right column labels start at center + margin
    const rightValueX = pageWidth - 15; // Right column values right-aligned
    let leftY = currentY;
    let rightY = currentY;

    // Helper for rows - two-column layout with proper spacing
    const drawLeftRow = (key: string, value: string, y: number, maxValueWidth?: number) => {
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(8);
        doc.text(key + ':', leftX, y);
        doc.setFont('Roboto', 'bold');
        // Truncate value if too long
        let displayValue = value;
        const maxWidth = maxValueWidth || 35; // Default max width for values
        while (doc.getTextWidth(displayValue) > maxWidth && displayValue.length > 3) {
            displayValue = displayValue.slice(0, -4) + '...';
        }
        doc.text(displayValue, leftValueX, y);
    };

    const drawRightRow = (key: string, value: string, y: number) => {
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(8);
        doc.text(key + ':', rightLabelX, y);
        doc.setFont('Roboto', 'bold');
        doc.text(value, rightValueX, y, { align: 'right' });
    };

    const addLeft = (k: string, v: string, maxWidth?: number) => { drawLeftRow(k, v, leftY, maxWidth); leftY += 5; };
    const addRight = (k: string, v: string) => { drawRightRow(k, v, rightY); rightY += 5; };
    const materialNames = await getMaterialNamesMap();
    const resolveMaterialDisplayName = (
        materialId: number,
        joinedMaterialName?: string,
        fallbackValue = '-'
    ): string => {
        if (materialId > 0) {
            const cachedName = materialNames.get(materialId);
            if (cachedName) return cachedName;
        }
        if (joinedMaterialName && joinedMaterialName.trim().length > 0) {
            return joinedMaterialName;
        }
        return fallbackValue;
    };

    // --- Left Column Inputs ---
    // Dionica - show full name without truncation
    addLeft('Dionica', report.dionica || '-');

    const typeId = Number(report.type_id);
    const draftId = Number(report.draft_id) || 1;
    const isAirMethod = typeId === 2;
    const isAirPipeOnly = isAirMethod && draftId === 2;
    const isAirShaftAndPipe = isAirMethod && draftId === 3;
    const airIncludesShaft = isAirMethod && !isAirPipeOnly;
    const airIncludesPipe = isAirMethod && (isAirPipeOnly || isAirShaftAndPipe);
    const isPipeOnly = draftId === 2; // Schema C (water) or pipe-only (air)
    const isGully = typeId === 1 && (draftId === 4 || draftId === 5);
    const typeLabel = isGully ? 'Tip slivnika' : 'Tip okna';
    const materialLabel = isGully ? 'Materijal slivnika' : 'Materijal okna';
    const widthLabel = isGully ? 'Širina slivnika' : 'Širina okna';
    const lengthLabel = isGully ? 'Dužina slivnika' : 'Dužina okna';
    const heightLabel = isGully ? 'Visina slivnika' : 'Visina okna';
    const diameterLabel = isGully ? 'Promjer slivnika' : 'Promjer okna';

    // Hide shaft/gully type for pipe-only inspections (water Schema C, air pipe-only)
    if (!isPipeOnly && (!isAirMethod || airIncludesShaft)) {
        addLeft(typeLabel, report.material_type_id === 1 ? 'Okrugli' : 'Kvadratni');
    }

    // Material Name Logic
    const paneMaterialId = Number(report.pane_material_id) || 0;
    const pipeMaterialId = Number(report.pipe_material_id) || 0;
    const materialName = resolveMaterialDisplayName(
        paneMaterialId,
        report.pane_material?.name
    );
    // Hide shaft/gully material for pipe-only inspections
    if (!isAirMethod && !isPipeOnly) {
        addLeft(materialLabel, materialName);
    }

    // Dimensions
    if (typeId === 1) {
        if (report.material_type_id === 1) { // Round
            if (!isPipeOnly) { // Not Schema C (Pipe Only) - Schema C uses pane_diameter for main pipe
                addLeft(heightLabel, `${Math.round(report.ro_height || 0)} cm`);
            }

            if (isPipeOnly) {
                addLeft('Promjer gl. cijevi', `${(report.pane_diameter || 0).toFixed(0)} mm`);
            } else {
                addLeft(diameterLabel, `${(report.pane_diameter || 0).toFixed(0)} mm`);
            }
        } else {
            if (isPipeOnly) {
                // Schema C Rectangular uses Channel dimensions
                addLeft('Širina kanala', `${Math.round(report.pane_width || 0)} cm`);
                addLeft('Dužina kanala', `${Math.round(report.pane_length || 0)} cm`);
                addLeft('Visina kanala', `${Math.round(report.pane_height || 0)} cm`);
            } else {
                addLeft(widthLabel, `${Math.round(report.pane_width || 0)} cm`);
                addLeft(lengthLabel, `${Math.round(report.pane_length || 0)} cm`);
                addLeft(heightLabel, `${Math.round(report.pane_height || 0)} cm`);
            }
        }
    } else if (airIncludesShaft) {
        if (report.material_type_id === 1) {
            addLeft('Promjer okna', `${(report.pane_diameter || 0).toFixed(0)} mm`);
        } else {
            addLeft('Širina okna', `${Math.round(report.pane_width || 0)} cm`);
            addLeft('Dužina okna', `${Math.round(report.pane_length || 0)} cm`);
            addLeft('Visina okna', `${Math.round(report.pane_height || 0)} cm`);
        }
    }


    // Water Method specific
    if (typeId === 1) {
        addLeft('Visina vode', `${Math.round(report.water_height || 0)} cm`);
    }

    // Air Method specific
    if (typeId === 2) {
        const procNames: Record<number, string> = { 1: 'LA', 2: 'LB', 3: 'LC', 4: 'LD' };
        addLeft('Metoda ispitivanja', procNames[report.examination_procedure_id || 1] || 'LA');
    }

    if (typeId === 1) {
        addLeft('Trajanje', report.examination_duration || '-');
    }

    // --- Right Column Inputs (Pipe Info) ---
    // Show pipe info for B(3), C(2), E(5) - only for Water Method
    if (typeId === 1 && [2, 3, 5].includes(draftId)) {
        const pipeMatName = resolveMaterialDisplayName(
            pipeMaterialId,
            report.pipe_material?.name
        );

        addRight('Materijal cijevi', pipeMatName);
        addRight('Dužina cijevi', `${(report.pipe_length || 0).toFixed(1)} m`);
        addRight('Promjer cijevi', `${(report.pipe_diameter || 0).toFixed(0)} mm`);

        if ([4, 5].includes(draftId)) { // D or E
            addRight('Taložna visina', `${Math.round(report.depositional_height || 0)} cm`);
        }

        addRight('Nagib', `${(report.pipeline_slope || 0).toFixed(1)} %`);
    }

    // For Air Method, show measurements in the right column
    if (typeId === 2) {
        if (airIncludesPipe) {
            // Show pipe material info if selected
            const pipeMat = resolveMaterialDisplayName(
                pipeMaterialId,
                report.pipe_material?.name
            );
            if (pipeMat !== '-') {
                addRight('Materijal cijevi', pipeMat);
            }

            if (report.pipe_length && report.pipe_length > 0) {
                addRight('Dužina cijevi', `${(report.pipe_length).toFixed(1)} m`);
            }
            if (report.pipe_diameter && report.pipe_diameter > 0) {
                addRight('Promjer cijevi', `${(report.pipe_diameter).toFixed(0)} mm`);
            }
        }

        const stabTime = report.stabilization_time || '00:00';
        addRight('Vr. stabilizacije', stabTime.toString());

        // Format required test time (convert minutes to mm:ss)
        const testTimeMins = report.required_test_time || 0;
        const testMins = Math.floor(testTimeMins);
        const testSecs = Math.round((testTimeMins - testMins) * 60);
        addRight('Vr. ispitivanja', `${testMins}m ${testSecs.toString().padStart(2, '0')}s`);

        addRight('Tlak poc.', `${(report.pressure_start || 0).toFixed(1)} mbar`);
        addRight('Tlak kraj', `${(report.pressure_end || 0).toFixed(1)} mbar`);
        addRight('Pad tlaka', `${(report.pressure_loss || 0).toFixed(1)} mbar`);
    }

    // Sync Y for Results
    currentY = Math.max(leftY, rightY) + 10;

    // --- Results Section ---
    leftY = currentY;
    rightY = currentY;

    if (typeId === 1) { // Water Results
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

        // Display Results (Left Column) - Use shorter labels to fit
        if (draftId === 1 || draftId === 3 || draftId === 4 || draftId === 5) {
            const label = (draftId === 4 || draftId === 5) ? 'Om. povr. slivnika' : 'Om. povr. okna';
            addLeft(label, `${wettedShaft.toFixed(1)} m²`);
        } else if (draftId === 2) {
            if (report.material_type_id === 2) {
                addLeft('Om. povr. kanala', `${wettedShaft.toFixed(1)} m²`);
            } else {
                addLeft('Om. povr. okna', `${wettedShaft.toFixed(1)} m²`);
            }
        }

        if ([2, 3, 5].includes(draftId)) {
            addLeft('Om. povr. cijevi', `${wettedPipe.toFixed(1)} m²`);
        }

        addLeft('Ukupna om. povr.', `${totalArea.toFixed(1)} m²`);
        addLeft('Dozv. gubitak (l)', `${allowedLossL.toFixed(1)} l`);
        addLeft('Dozv. gubitak (mm)', `${allowedLossMm.toFixed(1)} mm`);

        // Display Results (Right Column) - Use shorter labels
        addRight('Vis. vode na poc.', `${Math.round(report.water_height_start || 0)} mm`);
        addRight('Vis. vode na kraju', `${Math.round(report.water_height_end || 0)} mm`);

        if (draftId === 3 && hydrostaticHeight > 0) {
            addRight('Hidrost. visina', `${(hydrostaticHeight * 100).toFixed(0)} cm`);
        }

        addRight('Gubitak vode', `${waterLoss.toFixed(1)} mm`);
        addRight('\u0394V', `${volLoss.toFixed(4)} l`);
        addRight('Izmj. gubitak', `${result.toFixed(2)} l/m²`);
    } else if (typeId === 2) { // Air Method Results
        // Air method measurements are now in the input section above
        // Sync Y for table
        currentY = Math.max(leftY, rightY) + 5;

        // Draw EN 1610 Table
        const tableY = currentY;
        const tableWidth = 152;
        const tableX = (pageWidth - tableWidth) / 2;

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);

        // Main category headers
        doc.setFontSize(8);
        doc.setFont('Roboto', 'bold');
        doc.text('SUHE BETONSKE CIJEVI', tableX + 34.5, tableY + 2, { align: 'center' });
        doc.text('OSTALE CIJEVI', tableX + 119.5, tableY + 2, { align: 'center' });

        // Column configuration: DN + 4 methods + gap + DN + 4 methods
        const colWidths = [17, 13, 13, 13, 13, 18, 13, 13, 13, 13, 13];

        let y = tableY + 6;
        doc.setFontSize(7);

        // First header row - Methods
        doc.text('LA', tableX + 23.5, y, { align: 'center' });
        doc.text('LB', tableX + 36.5, y, { align: 'center' });
        doc.text('LC', tableX + 49.5, y, { align: 'center' });
        doc.text('LD', tableX + 62.5, y, { align: 'center' });

        doc.text('LA', tableX + 106.5, y, { align: 'center' });
        doc.text('LB', tableX + 119.5, y, { align: 'center' });
        doc.text('LC', tableX + 132.5, y, { align: 'center' });
        doc.text('LD', tableX + 145.5, y, { align: 'center' });

        // Second header row - Initial pressure p0 (two-line label in DN column)
        y += 7;
        doc.setFontSize(5.5);
        doc.setFont('Roboto', 'normal');
        doc.text('Poc. tlak', tableX + 8.5, y - 1.5, { align: 'center' });
        doc.text('p0 [mbar]', tableX + 8.5, y + 1.5, { align: 'center' });
        doc.text('Poc. tlak', tableX + 93.5, y - 1.5, { align: 'center' });
        doc.text('p0 [mbar]', tableX + 93.5, y + 1.5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('Roboto', 'bold');
        doc.text('10', tableX + 23.5, y, { align: 'center' });
        doc.text('50', tableX + 36.5, y, { align: 'center' });
        doc.text('100', tableX + 49.5, y, { align: 'center' });
        doc.text('200', tableX + 62.5, y, { align: 'center' });

        doc.text('10', tableX + 106.5, y, { align: 'center' });
        doc.text('50', tableX + 119.5, y, { align: 'center' });
        doc.text('100', tableX + 132.5, y, { align: 'center' });
        doc.text('200', tableX + 145.5, y, { align: 'center' });

        // Third header row - Allowed pressure drop dp (two-line label in DN column)
        y += 7;
        doc.setFontSize(5.5);
        doc.setFont('Roboto', 'normal');
        doc.text('Dozv. pad', tableX + 8.5, y - 1.5, { align: 'center' });
        doc.text('dp [mbar]', tableX + 8.5, y + 1.5, { align: 'center' });
        doc.text('Dozv. pad', tableX + 93.5, y - 1.5, { align: 'center' });
        doc.text('dp [mbar]', tableX + 93.5, y + 1.5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('Roboto', 'bold');
        doc.text('2,5', tableX + 23.5, y, { align: 'center' });
        doc.text('10', tableX + 36.5, y, { align: 'center' });
        doc.text('15', tableX + 49.5, y, { align: 'center' });
        doc.text('15', tableX + 62.5, y, { align: 'center' });

        doc.text('2,5', tableX + 106.5, y, { align: 'center' });
        doc.text('10', tableX + 119.5, y, { align: 'center' });
        doc.text('15', tableX + 132.5, y, { align: 'center' });
        doc.text('15', tableX + 145.5, y, { align: 'center' });

        // Fourth header row - unit clarification for time
        y += 4;
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(7);
        doc.text('Vrijeme ispitivanja t [min]', tableX + tableWidth / 2, y, { align: 'center' });
        doc.setFont('Roboto', 'normal');

        // DN header row above diameter values
        y += 4;
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(7);
        doc.text('DN [mm]', tableX + 8.5, y, { align: 'center' });
        doc.text('DN [mm]', tableX + 93.5, y, { align: 'center' });

        // Data rows
        y += 4;
        doc.setFont('Roboto', 'normal');
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
        doc.line(tableX, tableY + 15, tableX + tableWidth, tableY + 15); // After initial pressure
        doc.line(tableX, tableY + 22, tableX + tableWidth, tableY + 22); // After pressure drop
        doc.line(tableX, tableY + 26, tableX + tableWidth, tableY + 26); // After time header
        doc.setLineWidth(0.25);
        doc.line(tableX, tableY + 30, tableX + tableWidth, tableY + 30); // Before data (thicker)

        // Thin lines between data rows
        doc.setLineWidth(0.1);
        let rowLine = tableY + 34;
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
    doc.setFont('Roboto', 'normal');
    doc.text('Napomena:', 20, currentY);
    if (report.remark) {
        doc.setFont('Roboto', 'bold');
        doc.text(report.remark, 20, currentY + 5, { maxWidth: 80 });
    }

    doc.setFont('Roboto', 'normal');
    doc.text('Odstupanje od norme:', 110, currentY);
    if (report.deviation) {
        doc.setFont('Roboto', 'bold');
        doc.text(report.deviation, 110, currentY + 5, { maxWidth: 80 });
    }

    doc.setFontSize(12);
    doc.setFont('Roboto', 'bold');
    const displayName = userProfile ? `${userProfile.name} ${userProfile.last_name}` : 'Nepoznat korisnik';
    doc.text(`Izradio: ${displayName}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
};
