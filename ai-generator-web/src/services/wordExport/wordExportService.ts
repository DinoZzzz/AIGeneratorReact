import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import ImageModule from 'docxtemplater-image-module-free';
import type { ReportForm } from '../../types';
import type { ExportMetaData } from '../../components/ExportDialog';
import type { DocxTemplaterError, ReportFormWithJoins } from './types';
import { supabase } from '../../lib/supabase';
import { traceAsync, captureError } from '../../lib/sentry';
import { findRawTagPlacementIssues } from '../../utils/docxTemplate';
import { formatDate, formatNum } from './helpers';
import { loadFile } from './templateLoader';
import { createSoftBreakModule } from './softBreakModule';
import { fetchDocumentData } from './dataPreparation';
import { enrichReports, buildAirReportRows, buildWaterReportRows } from './tableBuilder';

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

            // 2. Prepare the zip and validate
            const zip = new PizZip(templateContent);

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

            // 3. Fetch all external data (construction, customer, profile, attachments)
            const docData = await fetchDocumentData(reports, metaData, userId);

            // 4. Configure Image Module
            const imageModule = new ImageModule({
                centered: false,
                getImage: (tagValue: string) => docData.imageMap[tagValue] ?? null,
                getSize: (_img: ArrayBuffer | null, tagValue: string): [number, number] => {
                    const dims = docData.imageDimensions[tagValue];
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

            // 5. Create docxtemplater instance with modules
            const softBreakModule = createSoftBreakModule();
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: false,
                modules: [imageModule, softBreakModule],
                nullGetter: () => ""
            });

            // 6. Enrich reports with joined data (procedures, materials)
            const reportsWithJoins = reports as ReportFormWithJoins[];
            await enrichReports(reportsWithJoins);
            const firstReport = reportsWithJoins[0];

            // 7. Build table rows
            const airReports = buildAirReportRows(reportsWithJoins);
            const waterReports = buildWaterReportRows(reportsWithJoins);

            // 8. Compute aggregation fields
            const pipeReports = reportsWithJoins.filter(r => r.draft_id !== 1 && r.draft_id !== 4);
            const totalLength = pipeReports.reduce((sum, r) => sum + (r.pipe_length || 0), 0);

            const minDate = reportsWithJoins.reduce((min, r) => r.examination_date < min ? r.examination_date : min, reportsWithJoins[0].examination_date);
            const maxDate = reportsWithJoins.reduce((max, r) => r.examination_date > max ? r.examination_date : max, reportsWithJoins[0].examination_date);
            const dateRange = minDate === maxDate ? formatDate(minDate) : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

            const minTemp = Math.min(...reportsWithJoins.map(r => r.temperature));
            const maxTemp = Math.max(...reportsWithJoins.map(r => r.temperature));
            const tempRange = minTemp === maxTemp ? `${minTemp.toFixed(0)} ºC` : `${minTemp.toFixed(0)} - ${maxTemp.toFixed(0)} ºC`;

            const satisfies = reportsWithJoins.every(r => r.satisfies);

            const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => r.pipe_material?.name || r.pipe_material_id))).filter(Boolean).join(', ');
            const uniquePaneMaterials = Array.from(new Set(reportsWithJoins.map(r => r.pane_material?.name || r.pane_material_id))).filter(Boolean).join(', ');
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
            const creatorFullName = docData.userProfile
                ? `${docData.userProfile.name || ''} ${docData.userProfile.last_name || ''}`.trim()
                : "";
            const creatorName = docData.userProfile?.title
                ? `${creatorFullName} ${docData.userProfile.title}`.trim()
                : creatorFullName || "System";

            // 9. Render the document
            const allAttachments = [...docData.attachments, ...docData.pdfReportImages];
            doc.render({
                creator: creatorName,
                certifier: metaData.certifierName,
                constructionSitePart: metaData.constructionPart || "-",
                currentDate: new Date().toLocaleDateString('hr-HR'),
                workOrder: docData.construction?.work_order || "-",
                examinationDate: dateRange,
                temperature: tempRange,

                customerName: docData.customer?.name || "-",
                constructionLocations: docData.construction?.location || "-",
                constructionSite: docData.construction?.name || "-",
                customerDetailed: docData.customer ? `${docData.customer.name}, ${docData.customer.address || ''} ${docData.customer.location || ''}` : "-",

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

                contentTable: docData.contentTable,
                hasAttachments: allAttachments.length > 0,
                attachments: allAttachments,
                Attachments: allAttachments,

                izradioLabel: docData.userProfile?.gender === 'F' ? 'izradila' : 'izradio',
                pregledaoLabel: docData.userProfile?.gender === 'F' ? 'Pregledala i odobrila' : 'Pregledao i odobrio',

                certifierSignature: metaData.certifierSignatureUrl ? 'certifierSignature' : null,
                hasCertifierSignature: !!metaData.certifierSignatureUrl && !!docData.imageMap['certifierSignature']
            });

            // 10. Output the document
            const blob = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // 11. Save file
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
            const workOrderPart = docData.construction?.work_order || metaData.constructionPart || 'Report';
            saveAs(blob, `${workOrderPart} - ${formattedDate}.docx`);

            // 12. Save to History (Database)
            if (userId) {
                try {
                    const finalConstructionId = docData.construction?.id || firstReport.construction_id;
                    const customerId = docData.customer?.id || firstReport.customer_id;
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
                }
            }

        } catch (error) {
            captureError(error instanceof Error ? error : new Error('Word export failed'), {
                reportCount: reports.length,
                constructionPart: metaData.constructionPart
            });

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
