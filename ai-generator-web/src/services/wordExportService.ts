import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import ImageModule from 'docxtemplater-image-module-free';
import type { ReportForm, ReportFile } from '../types';
import type { ExportMetaData } from '../components/ExportDialog';
import {
    calculatePressureLoss,
    calculateWaterVolumeLoss,
    calculateAllowedLossL,
    calculateResult,
    calculateTotalWettedArea,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface
} from '../lib/calculations/report';
import { supabase } from '../lib/supabase';

// Function to load file from Supabase Storage
const loadFile = async (path: string): Promise<ArrayBuffer> => {
    // Use getPublicUrl to bypass potential client-side caching issues with .download()
    const { data } = supabase.storage
        .from('templates')
        .getPublicUrl(path);

    if (!data.publicUrl) {
        throw new Error('Failed to get public URL for template');
    }

    // Add timestamp to prevent caching
    const response = await fetch(`${data.publicUrl}?t=${new Date().getTime()}`);

    if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
    }

    return await response.arrayBuffer();
};

// Helper to format date
const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hr-HR');
};

// Helper to format number
const formatNum = (num: number, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toFixed(decimals).replace('.', ',');
};

export const generateWordDocument = async (reports: ReportForm[], metaData: ExportMetaData, userId?: string) => {
    try {
        if (reports.length === 0) throw new Error("No reports selected");

        // 1. Load the template from Supabase Storage
        const templateContent = await loadFile('method1610.docx');

        // 2. Prepare the zip
        const zip = new PizZip(templateContent);

        // Check for valid docx structure
        if (!zip.files['word/document.xml']) {
            console.error("Invalid docx structure. Files found:", Object.keys(zip.files));
            throw new Error("The uploaded template is not a valid Word (.docx) file. It is missing 'word/document.xml'. Please ensure you are uploading a standard Word document.");
        }

        // 3. Fetch and Prepare Images (Attachments)
        // Only assume files are linked to the construction for now, or fetch all files for the construction.
        // A better approach is to fetch files for the construction ID.
        let constructionId = reports[0].construction_id;

        // Also need to fetch construction if missing to get ID
        let construction: any = (reports[0] as any).construction;
        let customer: any = construction?.customer;

        if (!construction && reports[0].construction_id) {
            const { data: constr } = await supabase
                .from('constructions')
                .select('*, customer:customers(*)')
                .eq('id', reports[0].construction_id)
                .single();

            if (constr) {
                construction = constr;
                customer = constr.customer;
                constructionId = constr.id;
            }
        }

        let attachments: any[] = [];
        let contentTable = "";
        const imageMap: Record<string, ArrayBuffer> = {};

        if (constructionId) {
            const { data: files } = await supabase
                .from('report_files')
                .select('*')
                .eq('construction_id', constructionId);

            if (files && files.length > 0) {
                // Filter for images (simple check on extension or type if available)
                // Assuming file_name ends with .jpg, .png, etc.
                const imageFiles = files.filter((f: ReportFile) => /\.(jpg|jpeg|png)$/i.test(f.file_name));
                const pdfFiles = files.filter((f: ReportFile) => /\.pdf$/i.test(f.file_name));

                // Build Content Table string
                // "7.1. Opis slike..."
                // Group PDFs

                // Logic from mapping: "It builds a formatted string list of all attachments"
                // We will list images first then PDFs or mixed.

                const allFiles = [...imageFiles, ...pdfFiles]; // or sort by creation

                if (allFiles.length > 0) {
                    // Start numbering from 7.1 if that's the convention, or just list them
                    // Mapping says: "7.1. Opis slike..."
                    // We will assume section 7 is Attachments.

                    contentTable = allFiles.map((f, i) => `7.${i + 1}. ${f.description || f.file_name}`).join('\n');
                }

                // Download images for insertion
                await Promise.all(imageFiles.map(async (f) => {
                    try {
                         const { data } = supabase.storage
                            .from('report-files') // Assuming bucket name
                            .getPublicUrl(f.file_path);

                        if (data.publicUrl) {
                             const res = await fetch(data.publicUrl);
                             if (res.ok) {
                                 const buf = await res.arrayBuffer();
                                 imageMap[f.file_path] = buf;
                                 attachments.push({
                                     path: f.file_path,
                                     name: f.file_name,
                                     // This property will be used by the template loop if we use {#attachments}{%image}{/attachments}
                                     image: f.file_path
                                 });
                             }
                        }
                    } catch (e) {
                        console.error(`Failed to load image ${f.file_name}`, e);
                    }
                }));
            }
        }

        // Configure Image Module
        const imageModule = new ImageModule({
            centered: false,
            getImage: (tagValue: string) => {
                // tagValue is what is in the data, e.g., f.file_path
                return imageMap[tagValue] ? imageMap[tagValue] : null;
            },
            getSize: () => {
                // Return [width, height]
                return [600, 400]; // Default size, maybe make it proportional if possible?
            }
        });

        // 4. Create docxtemplater instance with modules
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [imageModule]
        });

        // 5. Prepare data
        const firstReport = reports[0];

        // Fetch Procedure data for all air reports if missing
        const airReportsNeedData = reports.filter(r => r.type_id === 2 && !(r as any).examination_procedure);
        if (airReportsNeedData.length > 0) {
            const { data: procedures } = await supabase.from('examination_procedures').select('*');
            if (procedures) {
                reports.forEach(r => {
                    if (r.type_id === 2 && !(r as any).examination_procedure) {
                        (r as any).examination_procedure = procedures.find(p => p.id === r.examination_procedure_id);
                    }
                });
            }
        }

        // Fetch Material names if missing
        const materialIds = new Set<number>();
        reports.forEach(r => {
            if (r.pipe_material_id && !(r as any).pipe_material) materialIds.add(r.pipe_material_id);
            if (r.pane_material_id && !(r as any).pane_material) materialIds.add(r.pane_material_id);
        });

        if (materialIds.size > 0) {
            const { data: materials } = await supabase
                .from('materials')
                .select('*')
                .in('id', Array.from(materialIds));

            if (materials) {
                reports.forEach(r => {
                    if (r.pipe_material_id && !(r as any).pipe_material) {
                        (r as any).pipe_material = materials.find((m: any) => m.id === r.pipe_material_id);
                    }
                    if (r.pane_material_id && !(r as any).pane_material) {
                        (r as any).pane_material = materials.find((m: any) => m.id === r.pane_material_id);
                    }
                });
            }
        }

        // Group calculations for aggregation fields
        const pipeReports = reports.filter(r => r.draft_id !== 1 && r.draft_id !== 4); // Exclude only-shaft drafts
        const totalLength = pipeReports.reduce((sum, r) => sum + (r.pipe_length || 0), 0);

        const minDate = reports.reduce((min, r) => r.examination_date < min ? r.examination_date : min, reports[0].examination_date);
        const maxDate = reports.reduce((max, r) => r.examination_date > max ? r.examination_date : max, reports[0].examination_date);
        const dateRange = minDate === maxDate ? formatDate(minDate) : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

        const minTemp = Math.min(...reports.map(r => r.temperature));
        const maxTemp = Math.max(...reports.map(r => r.temperature));
        const tempRange = minTemp === maxTemp ? `${minTemp.toFixed(0)} ºC` : `${minTemp.toFixed(0)} - ${maxTemp.toFixed(0)} ºC`;

        const satisfies = reports.every(r => r.satisfies);

        // Prepare Air Method Table Data
        const airReports = reports
            .filter(r => r.type_id === 2) // Air
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((r, index) => {
                const proc = (r as any).examination_procedure;
                const procText = proc ? `${proc.name} - ${formatNum(proc.pressure, 2)}` : '-';
                const allowedLoss = proc ? formatNum(proc.allowed_loss, 2) : '-';

                return {
                    ordinal: index + 1,
                    stock: r.stock || '-',
                    pipeLength: (r.draft_id === 4 || r.pipe_length === 0) ? '-' : formatNum(r.pipe_length, 2),
                    procedureInfo: procText,
                    allowedLoss: allowedLoss,
                    pressureLoss: formatNum(calculatePressureLoss(r.pressure_start, r.pressure_end), 2),
                    constVal: "0.23"
                };
            });

        // Prepare Water Method Table Data
        const waterReports = reports
            .filter(r => r.type_id === 1) // Water
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((r, index) => {
                // Ensure meter conversion for calculations
                const rMeters = {
                    ...r,
                    pane_diameter: r.pane_diameter / 1000,
                    pane_width: r.pane_width / 100,
                    pane_length: r.pane_length / 100,
                    pipe_diameter: r.pipe_diameter / 1000,
                    water_height: r.water_height / 100
                };

                const waterLoss = Math.abs(r.water_height_end - r.water_height_start);
                const volLoss = calculateWaterVolumeLoss(waterLoss, r.material_type_id || 1, rMeters.pane_diameter, rMeters.pane_width, rMeters.pane_length);

                const wettedShaft = calculateWettedShaftSurface(r.draft_id, r.material_type_id || 1, rMeters.water_height, rMeters.pane_diameter, rMeters.pane_width, rMeters.pane_length);
                const wettedPipe = calculateWettedPipeSurface(r.draft_id, rMeters.pipe_diameter, r.pipe_length);
                const totalWetted = calculateTotalWettedArea(wettedPipe, wettedShaft);

                // For report display: Allowed Loss in Liters
                let criteria = 0.401; // Default
                if (r.draft_id === 2) criteria = 0.15;
                else if (r.draft_id === 3 || r.draft_id === 5) criteria = 0.201;

                const allowedLossL = calculateAllowedLossL(criteria, totalWetted);

                return {
                    ordinal: index + 1,
                    stock: r.stock || '-',
                    allowedLoss: formatNum(allowedLossL, 2),
                    waterVolumeLoss: formatNum(volLoss, 2),
                    result: formatNum(calculateResult(volLoss, totalWetted), 2)
                };
            });

        const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => (r as any).pipe_material?.name || r.pipe_material_id))).filter(Boolean).join(', ');
        const uniquePaneMaterials = Array.from(new Set(reports.map(r => (r as any).pane_material?.name || r.pane_material_id))).filter(Boolean).join(', ');

        const uniquePipeDiameters = Array.from(new Set(pipeReports.map(r => `ø ${r.pipe_diameter * 1000}`))).join(', ');
        const uniquePaneDiameters = Array.from(new Set(reports.map(r => `ø ${r.pane_diameter * 1000}`))).join(', ');


        // Build %WaterMethodCriteria%
        const criteriaList: string[] = [];
        if (reports.some(r => r.draft_id === 1)) criteriaList.push('reviziono okno = 0,40 l/m\u00B2');
        if (reports.some(r => r.draft_id === 2)) criteriaList.push('cjevovod + reviziono okno = 0,20 l/m\u00B2'); // Using 0.20 as per request, though code uses 0.15 logic elsewhere, sticking to string logic
        if (reports.some(r => r.draft_id === 3)) criteriaList.push('cjevovod = 0,15 l/m\u00B2');
        const waterMethodCriteria = criteriaList.join(', ');

        // Table naming logic
        const hasAirTests = airReports.length > 0;
        const hasWaterTests = waterReports.length > 0;
        const airMethodTableName = hasAirTests ? "Tablica br.1" : "";
        let waterMethodTableName = "";
        if (hasWaterTests) {
            waterMethodTableName = hasAirTests ? "Tablica br.2" : "Tablica br.1";
        }

        // Air Method Satisfies Logic
        // "ne zadovoljava" if any Air test fails
        const anyAirFailed = reports.filter(r => r.type_id === 2).some(r => !r.satisfies);
        const airMethodSatisfies = anyAirFailed ? "ne zadovoljava" : "zadovoljava"; // Or empty? Mapping says: "ne zadovoljava" if any fail.

        // 6. Set the data matching the Mustache tags in the docx template
        doc.render({
            creator: metaData.certifierName || "System",
            certifier: metaData.certifierName,
            constructionSitePart: metaData.constructionPart || "-",
            currentDate: new Date().toLocaleDateString('hr-HR'),
            workOrder: construction?.work_order || "-",
            examinationDate: dateRange,
            temperature: tempRange,

            customerName: customer?.name || "-",
            constructionLocations: construction?.location || "-",
            constructionSite: construction?.name || "-",
            customerDetailed: customer ? `${customer.name}, ${customer.address || ''} ${customer.location || ''}` : "-",

            // Summary Fields
            revisionPaneCount: reports.filter(r => r.draft_id !== 3 && r.draft_id !== 6).length + " kom.",
            tubeLengthSum: totalLength === 0 ? "-" : formatNum(totalLength, 2) + " m",
            drainage: metaData.drainage,

            // Remarks
            airMethodRemark: metaData.airRemark || "nema",
            airNormDeviation: metaData.airDeviation || "nema",
            waterMethodRemark: metaData.waterRemark || "nema",
            waterNormDeviation: metaData.waterDeviation || "nema",

            // Conditional Blocks (docxtemplater uses Boolean)
            hasAirTests: hasAirTests,
            hasWaterTests: hasWaterTests,
            hasPaneInfo: uniquePaneDiameters.length > 0,
            hasTubeInfo: uniquePipeDiameters.length > 0,

            // Tables
            airTests: airReports,
            waterTests: waterReports,
            airMethodTableName,
            waterMethodTableName,

            // Result
            satisfies: satisfies ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA",
            airMethodSatisfies,
            waterMethodCriteria,

            isUnsatisfied: !satisfies,
            unsatisfiedStocks: satisfies
                ? "Sve dionice zadovoljavaju uvjete vodonepropusnosti."
                : "Dionice " + reports.filter(r => !r.satisfies).map(r => r.stock).join(", ") + " ne zadovoljavaju uvjete vodonepropusnosti.",

            // Tech details
            tubeMaterials: uniquePipeMaterials,
            tubeDiameters: uniquePipeDiameters,
            paneMaterials: uniquePaneMaterials,
            paneDiameters: uniquePaneDiameters,

            // Attachments
            contentTable,
            attachments: attachments, // Expected loop: {#attachments} {%image} {/attachments}
            Attachments: attachments // Alias in case user uses {#Attachments}
        });

        // 7. Output the document
        const blob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // 8. Save file
        saveAs(blob, `${metaData.constructionPart || 'Report'}_${new Date().getTime()}.docx`);

        // 9. Save to History (Database)
        if (userId) {
            try {
                // Determine common values
                const constructionId = construction?.id || firstReport.construction_id;
                const customerId = customer?.id || firstReport.customer_id;
                // Use the type of the first report as default, or 0 if mixed/unknown
                const typeId = firstReport.type_id || 0;

                // Create export record
                const { data: exportData, error: exportError } = await supabase
                    .from('report_exports')
                    .insert({
                        certifier_id: userId,
                        user_id: userId,
                        construction_part: metaData.constructionPart || 'Unknown Part',
                        construction_id: constructionId,
                        customer_id: customerId,
                        type_id: typeId,
                        created_at: new Date().toISOString(),
                        is_finished: true,
                        certification_time: new Date().toISOString(),
                        examination_date: new Date().toISOString() // Default to now, or use dateRange if parsed
                    })
                    .select()
                    .single();

                if (exportError) throw exportError;

                if (exportData) {
                    // Create export forms records
                    const exportForms = reports.map((r, index) => ({
                        export_id: exportData.id,
                        form_id: r.id, // Changed from report_id to form_id to match interface
                        type_id: r.type_id,
                        ordinal: index + 1
                    }));

                    const { error: formsError } = await supabase
                        .from('report_export_forms')
                        .insert(exportForms);

                    if (formsError) throw formsError;
                }
            } catch (dbError) {
                console.error("Error saving to history:", dbError);
                // Don't block the file download if history save fails, but log it
            }
        }

    } catch (error) {
        console.error("Error generating document:", error);
        throw error;
    }
};
