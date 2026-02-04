import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import ImageModule from 'docxtemplater-image-module-free';
import type { ReportForm, ReportFile, Construction, Customer, Profile, Material, ExaminationProcedure } from '../types';
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
import { convertPdfToImages, dataUrlToArrayBuffer } from '../lib/pdfToImage';
import { traceAsync, captureError } from '../lib/sentry';
import { findRawTagPlacementIssues } from '../utils/docxTemplate';

// Type definitions for word export
interface AirReportRow {
    isSection: boolean;
    isReport: boolean;
    sectionName?: string;
    ordinal: string | number;
    stock: string;
    pipeLength: string;
    procedureInfo: string;
    allowedLoss: string;
    pressureLoss: string;
    uncertainty: string;
}

interface WaterReportRow {
    isSection: boolean;
    isReport: boolean;
    sectionName?: string;
    ordinal: string | number;
    stock: string;
    allowedLoss: string;
    waterVolumeLoss: string;
    result: string;
}

interface AttachmentItem {
    path: string;
    name: string;
    description: string;
    image: string;
}

interface ImageDimensions {
    width: number;
    height: number;
}

interface DocxTemplaterError {
    properties?: {
        errors?: Array<{
            message: string;
            part: string;
            offset: number;
            context: string;
        }>;
    };
}

// Extended ReportForm with joined data
type ReportFormWithJoins = ReportForm & {
    examination_procedure?: ExaminationProcedure;
    pipe_material?: Material;
    pane_material?: Material;
};

// Partial types for database queries
type ConstructionPartial = Pick<Construction, 'id' | 'name' | 'location' | 'customer_id'> & { work_order?: string };
type CustomerPartial = Pick<Customer, 'id' | 'name' | 'address' | 'location'>;
type ProfilePartial = Pick<Profile, 'id' | 'name' | 'last_name' | 'gender' | 'title'>;
type ReportFilePartial = Pick<ReportFile, 'id' | 'file_name' | 'file_path' | 'description' | 'construction_id'>;
type MaterialPartial = { id: number; name: string };

// Function to load file from Supabase Storage
const loadFile = async (path: string): Promise<ArrayBuffer> => {
    const { data } = supabase.storage
        .from('templates')
        .getPublicUrl(path);

    if (!data.publicUrl) {
        throw new Error('Failed to get public URL for template');
    }

    const response = await fetch(`${data.publicUrl}?t=${new Date().getTime()}`);

    if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
    }

    return await response.arrayBuffer();
};

// Helper to format date
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hr-HR');
};

// Custom module for soft line breaks (preserves font styling)
// Standard linebreaks: true creates new paragraphs which lose font info
const createSoftBreakModule = () => {
    const softBreakPlaceholder = '___SOFT_BREAK___';

    return {
        name: 'SoftBreakModule',
        // Transform data before rendering - replace \n with placeholder
        set: function(options: { data: Record<string, unknown> }) {
            if (options.data) {
                const transformValue = (value: unknown): unknown => {
                    if (typeof value === 'string') {
                        return value.replace(/\n/g, softBreakPlaceholder);
                    }
                    if (Array.isArray(value)) {
                        return value.map(transformValue);
                    }
                    if (value && typeof value === 'object') {
                        const transformed: Record<string, unknown> = {};
                        for (const key in value as Record<string, unknown>) {
                            transformed[key] = transformValue((value as Record<string, unknown>)[key]);
                        }
                        return transformed;
                    }
                    return value;
                };
                options.data = transformValue(options.data) as Record<string, unknown>;
            }
        },
        // Post-process the XML to replace placeholder with actual soft breaks
        postparse: function(parsed: unknown) {
            return parsed;
        },
        postrender: function(parts: string[]) {
            // Replace placeholder with Word soft break XML
            return parts.map(part =>
                part.replace(new RegExp(softBreakPlaceholder, 'g'), '</w:t><w:br/><w:t>')
            );
        }
    };
};

// Helper to format number
const formatNum = (num: number | undefined | null, decimals = 2): string => {
    if (num === undefined || num === null) return '-';
    return num.toFixed(decimals).replace('.', ',');
};

// Helper to get image dimensions
const getImageDimensions = (url: string): Promise<ImageDimensions> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            resolve({ width: 600, height: 400 }); // Fallback
        };
        img.src = url;
    });
};

export const generateWordDocument = async (
    reports: ReportForm[],
    metaData: ExportMetaData,
    userId?: string
): Promise<void> => {
    return traceAsync('generateWordDocument', 'export.word', async () => {
        try {
            if (reports.length === 0) throw new Error("No reports selected");

            // 1. Load the template from Supabase Storage
            const templateContent = await traceAsync('loadTemplate', 'storage.download', () =>
                loadFile('method1610.docx')
            );

            // 2. Prepare the zip
            const zip = new PizZip(templateContent);

            // Check for valid docx structure
            if (!zip.files['word/document.xml']) {
                throw new Error("The uploaded template is not a valid Word (.docx) file. It is missing 'word/document.xml'.");
            }

            const rawTagIssues = findRawTagPlacementIssues(zip, ['image', 'certifierSignature']);
            if (rawTagIssues.length > 0) {
                const issueSummary = rawTagIssues
                    .map((issue) => `${issue.tag} in ${issue.file}`)
                    .join(', ');
                throw new Error(
                    `Template error: image tags must be placed inside a paragraph. Fix tags: ${issueSummary}.`
                );
            }

            // 3. Fetch and Prepare Images (Attachments)
            let constructionId = reports[0].construction_id;

            // Fetch construction and customer data
            let construction: ConstructionPartial | null = null;
            let customer: CustomerPartial | null = null;

            if (reports[0].construction_id) {
                const { data: constr } = await supabase
                    .from('constructions')
                    .select('id, name, location, work_order, customer_id')
                    .eq('id', reports[0].construction_id)
                    .single();

                if (constr) {
                    construction = constr;
                    constructionId = constr.id;

                    if (constr.customer_id) {
                        const { data: cust } = await supabase
                            .from('customers')
                            .select('id, name, address, location')
                            .eq('id', constr.customer_id)
                            .single();

                        if (cust) {
                            customer = cust;
                        }
                    }
                }
            }

            // Fetch user profile for gender determination and creator name
            let userProfile: ProfilePartial | null = null;
            if (userId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, name, last_name, gender, title')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    userProfile = profile;
                }
            }

            const attachments: AttachmentItem[] = [];
            let contentTable = "";
            const imageMap: Record<string, ArrayBuffer> = {};
            const imageDimensions: Record<string, ImageDimensions> = {};

            // Fetch certifier signature if available
            if (metaData.certifierSignatureUrl) {
                try {
                    const signatureResponse = await fetch(metaData.certifierSignatureUrl);
                    if (signatureResponse.ok) {
                        const signatureBuffer = await signatureResponse.arrayBuffer();
                        imageMap['certifierSignature'] = signatureBuffer;
                        try {
                            const dims = await getImageDimensions(metaData.certifierSignatureUrl);
                            const maxWidth = 150;
                            if (dims.width > maxWidth) {
                                const ratio = maxWidth / dims.width;
                                imageDimensions['certifierSignature'] = {
                                    width: maxWidth,
                                    height: Math.round(dims.height * ratio)
                                };
                            } else {
                                imageDimensions['certifierSignature'] = dims;
                            }
                        } catch {
                            imageDimensions['certifierSignature'] = { width: 150, height: 50 };
                        }
                    }
                } catch {
                    // Non-critical: continue without signature
                }
            }

            if (constructionId) {
                const { data: files } = await supabase
                    .from('report_files')
                    .select('id, file_name, file_path, description, construction_id')
                    .eq('construction_id', constructionId);

                if (files && files.length > 0) {
                    const imageFiles = files.filter((f: ReportFilePartial) => /\.(jpg|jpeg|png)$/i.test(f.file_name));
                    const pdfFiles = files.filter((f: ReportFilePartial) => /\.pdf$/i.test(f.file_name));
                    const allFiles = [...imageFiles, ...pdfFiles];

                    if (allFiles.length > 0) {
                        contentTable = allFiles.map((f, i) => `7.${i + 1}. ${f.description || f.file_name}`).join('\n');
                    }

                    // Download images for insertion
                    await Promise.all(imageFiles.map(async (f) => {
                        try {
                            const { data } = supabase.storage
                                .from('report-files')
                                .getPublicUrl(f.file_path);

                            if (data.publicUrl) {
                                const [res, dimensions] = await Promise.all([
                                    fetch(data.publicUrl, { headers: { 'Accept': '*/*' } }),
                                    getImageDimensions(data.publicUrl)
                                ]);

                                if (res.ok) {
                                    const buf = await res.arrayBuffer();
                                    imageMap[f.file_path] = buf;
                                    imageDimensions[f.file_path] = dimensions;

                                    attachments.push({
                                        path: f.file_path,
                                        name: f.file_name,
                                        description: f.description || f.file_name,
                                        image: f.file_path
                                    });
                                }
                            }
                        } catch {
                            // Non-critical: skip failed image
                        }
                    }));
                }
            }

            // 3b. Generate PDF reports if requested
            const pdfReportImages: AttachmentItem[] = [];
            if (metaData.includePdfs) {
                try {
                    const { generateBulkPDFAsBlob } = await import('../lib/pdfGenerator');
                    const pdfBlob = await traceAsync('generatePDF', 'export.pdf', () =>
                        generateBulkPDFAsBlob(reports, userProfile as Profile | undefined)
                    );

                    const pdfImages = await traceAsync('convertPdfToImages', 'export.convert', () =>
                        convertPdfToImages(pdfBlob)
                    );

                    pdfImages.forEach((imageDataUrl, index) => {
                        const pdfPagePath = `pdf_page_${index}`;
                        const imageBuffer = dataUrlToArrayBuffer(imageDataUrl);
                        imageMap[pdfPagePath] = imageBuffer;
                        imageDimensions[pdfPagePath] = { width: 600, height: 849 };

                        pdfReportImages.push({
                            path: pdfPagePath,
                            description: `Izvještaj stranica ${index + 1}`,
                            image: pdfPagePath,
                            name: `page_${index + 1}.png`
                        });
                    });

                    if (pdfReportImages.length > 0) {
                        const pdfContentTable = pdfReportImages.map((img, i) =>
                            `8.${i + 1}. ${img.description}`
                        ).join('\n');

                        contentTable = contentTable ? `${contentTable}\n${pdfContentTable}` : pdfContentTable;
                    }
                } catch (error) {
                    captureError(error instanceof Error ? error : new Error('PDF generation failed'), {
                        reportCount: reports.length
                    });
                    // Continue without PDFs
                }
            }

            // Configure Image Module
            const imageModule = new ImageModule({
                centered: false,
                getImage: (tagValue: string) => imageMap[tagValue] ?? null,
                getSize: (_img: ArrayBuffer | null, tagValue: string): [number, number] => {
                    const dims = imageDimensions[tagValue];
                    if (dims) {
                        const maxWidth = 600;
                        if (dims.width > maxWidth) {
                            const ratio = maxWidth / dims.width;
                            return [maxWidth, dims.height * ratio];
                        }
                        return [dims.width, dims.height];
                    }
                    return [600, 400];
                }
            });

            // 4. Create docxtemplater instance with modules
            // Using custom soft break module instead of linebreaks: true
            // to preserve font styling (paragraph breaks lose font info)
            const softBreakModule = createSoftBreakModule();
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: false, // Disabled - using soft breaks instead
                modules: [imageModule, softBreakModule],
                nullGetter: () => ""
            });

            // 5. Prepare data - cast to mutable type for joining
            const reportsWithJoins = reports as ReportFormWithJoins[];
            const firstReport = reportsWithJoins[0];

            // Fetch Procedure data for all air reports if missing
            const airReportsNeedData = reportsWithJoins.filter(r => r.type_id === 2 && !r.examination_procedure);
            if (airReportsNeedData.length > 0) {
                const { data: procedures } = await supabase
                    .from('examination_procedures')
                    .select('id, name, pressure, allowed_loss');

                if (procedures) {
                    reportsWithJoins.forEach(r => {
                        if (r.type_id === 2 && !r.examination_procedure) {
                            r.examination_procedure = procedures.find(
                                (p: ExaminationProcedure) => p.id === r.examination_procedure_id
                            );
                        }
                    });
                }
            }

            // Fetch Material names if missing
            const materialIds = new Set<number>();
            reportsWithJoins.forEach(r => {
                if (r.pipe_material_id && !r.pipe_material) materialIds.add(r.pipe_material_id);
                if (r.pane_material_id && !r.pane_material) materialIds.add(r.pane_material_id);
            });

            if (materialIds.size > 0) {
                const { data: materials } = await supabase
                    .from('materials')
                    .select('id, name')
                    .in('id', Array.from(materialIds));

                if (materials) {
                    reportsWithJoins.forEach(r => {
                        if (r.pipe_material_id && !r.pipe_material) {
                            r.pipe_material = materials.find((m: MaterialPartial) => m.id === r.pipe_material_id) as Material | undefined;
                        }
                        if (r.pane_material_id && !r.pane_material) {
                            r.pane_material = materials.find((m: MaterialPartial) => m.id === r.pane_material_id) as Material | undefined;
                        }
                    });
                }
            }

            // Group calculations for aggregation fields
            const pipeReports = reportsWithJoins.filter(r => r.draft_id !== 1 && r.draft_id !== 4);
            const totalLength = pipeReports.reduce((sum, r) => sum + (r.pipe_length || 0), 0);

            const minDate = reportsWithJoins.reduce((min, r) => r.examination_date < min ? r.examination_date : min, reportsWithJoins[0].examination_date);
            const maxDate = reportsWithJoins.reduce((max, r) => r.examination_date > max ? r.examination_date : max, reportsWithJoins[0].examination_date);
            const dateRange = minDate === maxDate ? formatDate(minDate) : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

            const minTemp = Math.min(...reportsWithJoins.map(r => r.temperature));
            const maxTemp = Math.max(...reportsWithJoins.map(r => r.temperature));
            const tempRange = minTemp === maxTemp ? `${minTemp.toFixed(0)} ºC` : `${minTemp.toFixed(0)} - ${maxTemp.toFixed(0)} ºC`;

            const satisfies = reportsWithJoins.every(r => r.satisfies);

            // Prepare Air Method Table Data
            const sortedAirItems = reportsWithJoins
                .filter(r => r.type_id === 2 || (!r.type_id && r.section_name && r.material_type_id === 2))
                .sort((a, b) => a.ordinal - b.ordinal);

            const airReports: AirReportRow[] = [];
            let airOrdinal = 1;

            sortedAirItems.forEach((r) => {
                if (r.section_name && !r.type_id) {
                    airReports.push({
                        isSection: true,
                        isReport: false,
                        sectionName: r.section_name,
                        ordinal: '',
                        stock: '',
                        pipeLength: '',
                        procedureInfo: '',
                        allowedLoss: '',
                        pressureLoss: '',
                        uncertainty: ''
                    });
                    return;
                }

                const proc = r.examination_procedure;
                const procText = proc ? `${proc.name} - ${formatNum(proc.pressure, 2)}` : '-';
                const allowedLoss = proc ? formatNum(proc.allowed_loss, 2) : '-';

                airReports.push({
                    isSection: false,
                    isReport: true,
                    ordinal: airOrdinal++,
                    stock: r.dionica || r.stock || '-',
                    pipeLength: (r.draft_id === 4 || r.pipe_length === 0) ? '-' : formatNum(r.pipe_length, 2),
                    procedureInfo: procText,
                    allowedLoss: allowedLoss,
                    pressureLoss: formatNum(calculatePressureLoss(r.pressure_start, r.pressure_end), 2),
                    uncertainty: "0.23"
                });
            });

            // Prepare Water Method Table Data
            const sortedWaterItems = reportsWithJoins
                .filter(r => r.type_id === 1 || (!r.type_id && r.section_name && r.material_type_id === 1))
                .sort((a, b) => a.ordinal - b.ordinal);

            const waterReports: WaterReportRow[] = [];
            let waterOrdinal = 1;

            sortedWaterItems.forEach((r) => {
                if (r.section_name && !r.type_id) {
                    waterReports.push({
                        isSection: true,
                        isReport: false,
                        sectionName: r.section_name,
                        ordinal: '',
                        stock: '',
                        allowedLoss: '',
                        waterVolumeLoss: '',
                        result: ''
                    });
                    return;
                }

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

                let criteria = 0.401;
                if (r.draft_id === 2) criteria = 0.15;
                else if (r.draft_id === 3 || r.draft_id === 5) criteria = 0.201;

                const allowedLossL = calculateAllowedLossL(criteria, totalWetted);

                waterReports.push({
                    isSection: false,
                    isReport: true,
                    ordinal: waterOrdinal++,
                    stock: r.dionica || r.stock || '-',
                    allowedLoss: formatNum(allowedLossL, 2),
                    waterVolumeLoss: formatNum(volLoss, 2),
                    result: formatNum(calculateResult(volLoss, totalWetted), 2)
                });
            });

            const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => r.pipe_material?.name || r.pipe_material_id))).filter(Boolean).join(', ');
            const uniquePaneMaterials = Array.from(new Set(reportsWithJoins.map(r => r.pane_material?.name || r.pane_material_id))).filter(Boolean).join(', ');
            // Diameters are stored in mm, no conversion needed
            const uniquePipeDiameters = Array.from(new Set(pipeReports.map(r => `ø ${r.pipe_diameter} mm`))).filter(d => d !== 'ø 0 mm' && d !== 'ø undefined mm').join(', ');
            const uniquePaneDiameters = Array.from(new Set(reportsWithJoins.map(r => `ø ${r.pane_diameter} mm`))).filter(d => d !== 'ø 0 mm' && d !== 'ø undefined mm').join(', ');

            // Build WaterMethodCriteria
            const criteriaList: string[] = [];
            if (reportsWithJoins.some(r => r.draft_id === 1)) criteriaList.push('reviziono okno = 0,40 l/m²');
            if (reportsWithJoins.some(r => r.draft_id === 2)) criteriaList.push('cjevovod = 0,15 l/m²');
            if (reportsWithJoins.some(r => r.draft_id === 3)) criteriaList.push('cjevovod + reviziono okno = 0,20 l/m²');
            if (reportsWithJoins.some(r => r.draft_id === 4)) criteriaList.push('slivnik = 0,40 l/m²');
            if (reportsWithJoins.some(r => r.draft_id === 5)) criteriaList.push('cjevovod + slivnik = 0,20 l/m²');
            const waterMethodCriteria = criteriaList.join(', ');

            // Table naming logic
            const hasAirTests = airReports.length > 0;
            const hasWaterTests = waterReports.length > 0;
            const airMethodTableName = hasAirTests ? "Tablica br.1" : "";
            const waterMethodTableName = hasWaterTests ? (hasAirTests ? "Tablica br.2" : "Tablica br.1") : "";

            const anyAirFailed = reportsWithJoins.filter(r => r.type_id === 2).some(r => !r.satisfies);
            const airMethodSatisfies = anyAirFailed ? "ne zadovoljava" : "zadovoljava";

            // Creator name
            const creatorFullName = userProfile
                ? `${userProfile.name || ''} ${userProfile.last_name || ''}`.trim()
                : "";
            const creatorName = userProfile?.title
                ? `${creatorFullName} ${userProfile.title}`.trim()
                : creatorFullName || "System";

            // 6. Render the document
            doc.render({
                creator: creatorName,
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

                revisionPaneCount: reportsWithJoins.filter(r => r.draft_id !== 3 && r.draft_id !== 6).length + " kom.",
                tubeLengthSum: totalLength === 0 ? "-" : formatNum(totalLength, 2) + " m",
                drainage: metaData.drainage,

                airMethodRemark: metaData.airRemark || "nema",
                airNormDeviation: metaData.airDeviation || "nema",
                waterMethodRemark: metaData.waterRemark || "nema",
                waterNormDeviation: metaData.waterDeviation || "nema",

                hasAirTests,
                hasWaterTests,
                hasPaneInfo: uniquePaneDiameters.length > 0,
                hasTubeInfo: uniquePipeDiameters.length > 0,

                airTests: airReports,
                waterTests: waterReports,
                airReports,
                waterReports,
                airMethodTableName,
                waterMethodTableName,

                satisfies: satisfies ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA",
                airMethodSatisfies,
                waterMethodCriteria,

                isUnsatisfied: !satisfies,
                unsatisfiedStocks: satisfies
                    ? "Sve dionice zadovoljavaju uvjete vodonepropusnosti."
                    : "Dionice " + reportsWithJoins.filter(r => !r.satisfies).map(r => r.stock).join(", ") + " ne zadovoljavaju uvjete vodonepropusnosti.",

                tubeMaterials: uniquePipeMaterials,
                tubeDiameters: uniquePipeDiameters,
                paneMaterials: uniquePaneMaterials,
                paneDiameters: uniquePaneDiameters,

                contentTable,
                hasAttachments: attachments.length > 0 || pdfReportImages.length > 0,
                attachments: [...attachments, ...pdfReportImages],
                Attachments: [...attachments, ...pdfReportImages],

                izradioLabel: userProfile?.gender === 'F' ? 'izradila' : 'izradio',
                pregledaoLabel: userProfile?.gender === 'F' ? 'Pregledala i odobrila' : 'Pregledao i odobrio',

                certifierSignature: metaData.certifierSignatureUrl ? 'certifierSignature' : null,
                hasCertifierSignature: !!metaData.certifierSignatureUrl && !!imageMap['certifierSignature']
            });

            // 7. Output the document
            const blob = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // 8. Save file
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
            const workOrderPart = construction?.work_order || metaData.constructionPart || 'Report';
            saveAs(blob, `${workOrderPart} - ${formattedDate}.docx`);

            // 9. Save to History (Database)
            if (userId) {
                try {
                    const finalConstructionId = construction?.id || firstReport.construction_id;
                    const customerId = customer?.id || firstReport.customer_id;
                    const typeId = firstReport.type_id || 0;

                    const { data: exportData, error: exportError } = await supabase
                        .from('report_exports')
                        .insert({
                            certifier_id: userId,
                            user_id: userId,
                            construction_part: metaData.constructionPart || 'Unknown Part',
                            construction_id: finalConstructionId,
                            customer_id: customerId,
                            type_id: typeId,
                            drainage: metaData.drainage || null,
                            water_remark: metaData.waterRemark || null,
                            water_deviation: metaData.waterDeviation || null,
                            air_remark: metaData.airRemark || null,
                            air_deviation: metaData.airDeviation || null,
                            is_finished: true,
                            certification_time: new Date().toISOString(),
                            examination_date: firstReport.examination_date || new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (exportError) throw exportError;

                    if (exportData) {
                        const exportForms = reportsWithJoins.map((r, index) => ({
                            export_id: exportData.id,
                            form_id: r.id,
                            type_id: r.type_id,
                            ordinal: index + 1
                        }));

                        const { error: formsError } = await supabase
                            .from('report_export_forms')
                            .insert(exportForms);

                        if (formsError) throw formsError;
                    }
                } catch (dbError) {
                    captureError(dbError instanceof Error ? dbError : new Error('History save failed'), {
                        userId,
                        reportCount: reports.length
                    });
                    // Don't block the file download if history save fails
                }
            }

        } catch (error) {
            // Capture to Sentry
            captureError(error instanceof Error ? error : new Error('Word export failed'), {
                reportCount: reports.length,
                constructionPart: metaData.constructionPart
            });

            // Enhanced error reporting for docxtemplater
            const docxError = error as DocxTemplaterError;
            if (docxError.properties?.errors) {
                docxError.properties.errors.forEach((err) => {
                    captureError(new Error(`Template error: ${err.message}`), {
                        part: err.part,
                        offset: err.offset,
                        context: err.context
                    });
                });
            }

            throw error;
        }
    }, { reportCount: reports.length });
};
