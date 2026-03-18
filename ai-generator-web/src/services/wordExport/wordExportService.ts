import type { ReportForm } from '../../types';
import type { ExportMetaData } from '../../components/ExportDialog';
import type { DocxTemplaterError, ReportFormWithJoins } from './types';
import { supabase } from '../../lib/supabase';
import { traceAsync, captureError } from '../../lib/sentry';
import { isNetworkError } from '../../lib/errorHandler';
import { isConflictDbError } from '../../lib/offlineConflict';
import { findExistingReportExportId } from '../../lib/reportExportHistory';
import { addToSyncQueue, saveManyToStore, saveToStore, STORES } from '../../lib/offlineDb';
import { findRawTagPlacementIssues } from '../../utils/docxTemplate';
import { formatDate, formatNum, sanitizeWordData } from './helpers';
import { loadFile } from './templateLoader';
import { createSoftBreakModule } from './softBreakModule';
import { fetchDocumentData } from './dataPreparation';
import { enrichReports, buildAirReportRows, buildWaterReportRows } from './tableBuilder';

export interface WordExportResult {
    historySaved: boolean;
    historyConflictRecovered: boolean;
    historyQueued: boolean;
}

const LEGACY_ATTACHMENTS_PARAGRAPH_REGEX = /<w:p>(?:(?!<w:p>).)*?<w:t>%Attachments%<\/w:t>(?:(?!<w:p>).)*?<\/w:p>/s;

const ATTACHMENTS_LOOP_BLOCK_XML = [
    '<w:p>',
    '<w:pPr><w:pStyle w:val="normal1"/><w:spacing w:lineRule="auto" w:line="240" w:before="0" w:after="0"/></w:pPr>',
    '<w:r><w:t>{#attachments}</w:t></w:r>',
    '</w:p>',
    '<w:p>',
    '<w:pPr><w:pStyle w:val="normal1"/><w:spacing w:lineRule="auto" w:line="240" w:before="200" w:after="0"/></w:pPr>',
    '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>Situacija</w:t></w:r>',
    '</w:p>',
    '<w:p>',
    '<w:pPr><w:pStyle w:val="normal1"/><w:spacing w:lineRule="auto" w:line="240" w:before="80" w:after="0"/></w:pPr>',
    '<w:r><w:t>{%image}</w:t></w:r>',
    '</w:p>',
    '<w:p>',
    '<w:pPr><w:pStyle w:val="normal1"/><w:spacing w:lineRule="auto" w:line="240" w:before="0" w:after="0"/></w:pPr>',
    '<w:r><w:t>{/attachments}</w:t></w:r>',
    '</w:p>'
].join('');

const patchLegacyAttachmentsPlaceholder = (zip: { file: (name: string, data?: string) => { asText: () => string } | null }): void => {
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) return;

    const content = documentXml.asText();
    if (!content.includes('%Attachments%')) return;

    const patchedContent = content.replace(LEGACY_ATTACHMENTS_PARAGRAPH_REGEX, ATTACHMENTS_LOOP_BLOCK_XML);
    if (patchedContent !== content) {
        zip.file('word/document.xml', patchedContent);
    }
};

interface QueuedExportHistoryPayload {
    exportPayload: Record<string, unknown> & {
        construction_id: string;
        customer_id: string;
        user_id: string;
        type_id: number;
        examination_date: string;
    };
    forms: Array<{
        form_id: string;
        type_id: number;
        ordinal: number;
    }>;
}

const queueHistorySave = async (payload: QueuedExportHistoryPayload): Promise<void> => {
    const queueId = `queued_export_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await saveToStore(STORES.EXPORT_HISTORY, {
        id: queueId,
        ...payload.exportPayload,
        forms_count: payload.forms.length,
        forms: payload.forms,
        created_at: now,
        updated_at: now,
        _is_offline: true
    });
    await saveManyToStore(STORES.EXPORT_HISTORY_FORMS, payload.forms.map((form, index) => ({
        id: `${queueId}:${form.form_id}:${index}`,
        export_id: queueId,
        form_id: form.form_id,
        type_id: form.type_id,
        ordinal: form.ordinal || index + 1,
        created_at: now,
        updated_at: now
    })));
    await addToSyncQueue(STORES.EXPORT_HISTORY, 'create', payload, queueId);
};

export const generateWordDocument = async (
    reports: ReportForm[],
    metaData: ExportMetaData,
    userId?: string
): Promise<WordExportResult> => {
    return traceAsync('generateWordDocument', 'export.word', async () => {
        try {
            const exportResult: WordExportResult = {
                historySaved: false,
                historyConflictRecovered: false,
                historyQueued: false
            };

            if (reports.length === 0) throw new Error("No reports selected");

            // Lazy-load heavy document libraries (only needed at export time)
            const [{ default: PizZip }, { default: Docxtemplater }, { saveAs }, { default: ImageModule }] = await Promise.all([
                import('pizzip'),
                import('docxtemplater'),
                import('file-saver'),
                import('docxtemplater-image-module-free'),
            ]);

            // 1. Load the template from Supabase Storage
            const templateContent = await traceAsync('loadTemplate', 'storage.download', () =>
                loadFile('method1610.docx')
            );

            // 2. Prepare the zip and validate
            const zip = new PizZip(templateContent);
            patchLegacyAttachmentsPlaceholder(zip);

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
            const actualReports = reportsWithJoins.filter((report) =>
                !report.section_name &&
                typeof report.type_id === 'number' &&
                report.type_id > 0
            );
            if (actualReports.length === 0) {
                throw new Error('No report rows selected');
            }
            const reportsForStats = actualReports;

            // 7. Build table rows
            const airReports = buildAirReportRows(reportsWithJoins);
            const waterReports = buildWaterReportRows(reportsWithJoins);

            // 8. Compute aggregation fields
            const pipeReports = reportsForStats.filter(r => r.draft_id !== 1 && r.draft_id !== 4);
            const totalLength = pipeReports.reduce((sum, r) => sum + (r.pipe_length || 0), 0);

            const minDate = reportsForStats.reduce((min, r) => r.examination_date < min ? r.examination_date : min, reportsForStats[0].examination_date);
            const maxDate = reportsForStats.reduce((max, r) => r.examination_date > max ? r.examination_date : max, reportsForStats[0].examination_date);
            const dateRange = minDate === maxDate ? formatDate(minDate) : `${formatDate(minDate)} - ${formatDate(maxDate)}`;

            const minTemp = Math.min(...reportsForStats.map(r => r.temperature));
            const maxTemp = Math.max(...reportsForStats.map(r => r.temperature));
            const tempRange = minTemp === maxTemp ? `${minTemp.toFixed(0)} ºC` : `${minTemp.toFixed(0)} - ${maxTemp.toFixed(0)} ºC`;

            const satisfies = reportsForStats.every(r => r.satisfies);

            const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => r.pipe_material?.name || r.pipe_material_id))).filter(Boolean).join(', ');
            const uniquePaneMaterials = Array.from(new Set(reportsForStats.map(r => r.pane_material?.name || r.pane_material_id))).filter(Boolean).join(', ');
            const uniquePipeDiameters = Array.from(new Set(pipeReports.map(r => `ø ${r.pipe_diameter} mm`))).filter(d => d !== 'ø 0 mm' && d !== 'ø undefined mm').join(', ');
            const uniquePaneDiameters = Array.from(new Set(reportsForStats.map(r => `ø ${r.pane_diameter} mm`))).filter(d => d !== 'ø 0 mm' && d !== 'ø undefined mm').join(', ');

            // Build WaterMethodCriteria
            const criteriaList: string[] = [];
            if (reportsForStats.some(r => r.draft_id === 1)) criteriaList.push('reviziono okno = 0,40 l/m²');
            if (reportsForStats.some(r => r.draft_id === 2)) criteriaList.push('cjevovod = 0,15 l/m²');
            if (reportsForStats.some(r => r.draft_id === 3)) criteriaList.push('cjevovod + reviziono okno = 0,20 l/m²');
            if (reportsForStats.some(r => r.draft_id === 4)) criteriaList.push('slivnik = 0,40 l/m²');
            if (reportsForStats.some(r => r.draft_id === 5)) criteriaList.push('cjevovod + slivnik = 0,20 l/m²');
            const waterMethodCriteria = criteriaList.join(', ');

            // Table naming logic
            const hasAirTests = airReports.length > 0;
            const hasWaterTests = waterReports.length > 0;
            const airMethodTableName = hasAirTests ? "Tablica br.1" : "";
            const waterMethodTableName = hasWaterTests ? (hasAirTests ? "Tablica br.2" : "Tablica br.1") : "";

            const anyAirFailed = reportsForStats.filter(r => r.type_id === 2).some(r => !r.satisfies);
            const airMethodSatisfies = anyAirFailed ? "ne zadovoljava" : "zadovoljava";
            const unsatisfiedSections = reportsForStats
                .filter((report) => !report.satisfies)
                .map((report) => report.dionica || report.stock || '')
                .filter(Boolean);
            const uniqueUnsatisfiedSections = Array.from(new Set(unsatisfiedSections));
            const unsatisfiedStocksText = satisfies
                ? "Sve dionice zadovoljavaju uvjete vodonepropusnosti."
                : uniqueUnsatisfiedSections.length > 0
                    ? `Dionice ${uniqueUnsatisfiedSections.join(", ")} ne zadovoljavaju uvjete vodonepropusnosti.`
                    : "Pojedine dionice ne zadovoljavaju uvjete vodonepropusnosti.";

            // Creator name
            const creatorFullName = docData.userProfile
                ? `${docData.userProfile.name || ''} ${docData.userProfile.last_name || ''}`.trim()
                : "";
            const creatorName = docData.userProfile?.title
                ? `${creatorFullName} ${docData.userProfile.title}`.trim()
                : creatorFullName || "System";

            // 9. Render the document
            const allAttachments = [...docData.attachments, ...docData.pdfReportImages];
            const renderData = {
                creator: creatorName,
                certifier: metaData.certifierName,
                constructionSitePart: metaData.constructionPart || "Sustav odvodnje otpadnih voda",
                currentDate: formatDate(new Date()),
                workOrder: docData.construction?.work_order || "-",
                examinationDate: dateRange,
                temperature: tempRange,

                customerName: docData.customer?.name || "-",
                constructionLocations: docData.construction?.location || "-",
                constructionSite: docData.construction?.name || "-",
                customerDetailed: docData.customer ? `${docData.customer.name}, ${docData.customer.address || ''} ${docData.customer.location || ''}` : "-",

                // Count all reports that include okno (1,3) or slivnik (4,5), exclude pipe-only (2) and other (6)
                revisionPaneCount: reportsForStats.filter(r => r.draft_id === 1 || r.draft_id === 3 || r.draft_id === 4 || r.draft_id === 5).length + " kom.",
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
                unsatisfiedStocks: unsatisfiedStocksText,

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
            };

            doc.render(sanitizeWordData(renderData));

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
                const historyForms = reportsWithJoins.filter((report) =>
                    Boolean(report.id) &&
                    !report.section_name &&
                    typeof report.type_id === 'number' &&
                    report.type_id > 0
                );

                // Use the first valid (non-section) report as the history anchor.
                const historyAnchor = historyForms[0];
                if (historyAnchor) {
                    const fallbackConstructionId = historyAnchor.construction_id || firstReport.construction_id;
                    const finalConstructionId = docData.construction?.id || fallbackConstructionId;
                    if (!finalConstructionId) {
                        captureError(new Error('History save failed: missing construction_id'), {
                            userId,
                            reportCount: reports.length,
                            source: 'wordExportService.historySave'
                        });
                        return exportResult;
                    }

                    const fallbackCustomerId = historyAnchor.customer_id || firstReport.customer_id;
                    const customerId = docData.customer?.id || docData.construction?.customer_id || fallbackCustomerId;
                    if (!customerId) {
                        captureError(new Error('History save failed: missing customer_id'), {
                            userId,
                            reportCount: reports.length,
                            source: 'wordExportService.historySave'
                        });
                        return exportResult;
                    }

                    const typeId = historyAnchor.type_id;
                    const examinationDateRaw = historyAnchor.examination_date || firstReport.examination_date;
                    const examinationDate = examinationDateRaw && !Number.isNaN(new Date(examinationDateRaw).getTime())
                        ? examinationDateRaw
                        : new Date().toISOString();

                    const exportPayload = {
                        certifier_id: userId,
                        user_id: userId,
                        construction_part: metaData.constructionPart || 'Sustav odvodnje otpadnih voda',
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
                        examination_date: examinationDate
                    };

                    const queuedPayload: QueuedExportHistoryPayload = {
                        exportPayload,
                        forms: historyForms.map((report, index) => ({
                            form_id: report.id as string,
                            type_id: report.type_id,
                            ordinal: index + 1
                        }))
                    };

                    try {
                        const { data: exportData, error: exportError } = await supabase
                            .from('report_exports')
                            .insert(exportPayload)
                            .select()
                            .single();

                        let resolvedExport = exportData;
                        if (exportError) {
                            if (!isConflictDbError(exportError)) {
                                throw exportError;
                            }

                            exportResult.historyConflictRecovered = true;

                            // Recover from duplicate export conflicts by reusing a matching export row.
                            const existingExportId = await findExistingReportExportId({
                                constructionId: finalConstructionId,
                                customerId,
                                userId,
                                typeId,
                                examinationDate
                            });

                            if (!existingExportId) {
                                throw exportError;
                            }

                            const { data: updatedExport, error: updateExportError } = await supabase
                                .from('report_exports')
                                .update(exportPayload)
                                .eq('id', existingExportId)
                                .select()
                                .single();

                            // Some RLS setups block update but allow linking forms to the existing export row.
                            resolvedExport = updateExportError
                                ? { id: existingExportId }
                                : (updatedExport || { id: existingExportId });
                        }

                        if (resolvedExport && queuedPayload.forms.length > 0) {
                            const exportForms = queuedPayload.forms.map((form) => ({
                                export_id: resolvedExport.id,
                                form_id: form.form_id,
                                type_id: form.type_id,
                                ordinal: form.ordinal
                            }));

                            // Ensure re-exports replace old form links cleanly.
                            const { error: deleteOldFormsError } = await supabase
                                .from('report_export_forms')
                                .delete()
                                .eq('export_id', resolvedExport.id);

                            if (deleteOldFormsError) throw deleteOldFormsError;

                            const { error: formsError } = await supabase
                                .from('report_export_forms')
                                .insert(exportForms);

                            if (formsError) throw formsError;
                        }

                        exportResult.historySaved = true;
                    } catch (dbError) {
                        const shouldQueueHistory = !navigator.onLine || isNetworkError(dbError);
                        if (shouldQueueHistory) {
                            try {
                                await queueHistorySave(queuedPayload);
                                exportResult.historyQueued = true;
                            } catch (queueError) {
                                captureError(queueError, {
                                    userId,
                                    reportCount: reports.length,
                                    source: 'wordExportService.historyQueue'
                                });
                            }
                        }

                        captureError(dbError, {
                            userId,
                            reportCount: reports.length,
                            source: 'wordExportService.historySave',
                            queued: shouldQueueHistory
                        });
                    }
                }
            }

            return exportResult;
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
