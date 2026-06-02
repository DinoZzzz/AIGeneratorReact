import type { ReportForm, Profile } from '../../types';
import type { ExportMetaData } from '../../components/ExportDialog';
import type {
    AttachmentItem,
    ImageDimensions,
    ReportFilePartial,
    PreparedDocumentData,
} from './types';
import { supabase } from '../../lib/supabase';
import { convertPdfToImages, dataUrlToArrayBuffer } from '../../lib/pdfToImage';
import { traceAsync, captureError } from '../../lib/sentry';
import { getImageDimensions } from './helpers';

export const fetchDocumentData = async (
    reports: ReportForm[],
    metaData: ExportMetaData,
    userId?: string
): Promise<PreparedDocumentData> => {
    let constructionId = reports[0].construction_id;

    // Fetch construction and customer data
    let construction: PreparedDocumentData['construction'] = null;
    let customer: PreparedDocumentData['customer'] = null;

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

    // Fetch user profile
    let userProfile: PreparedDocumentData['userProfile'] = null;
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

    // Fetch report files / attachments
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
                                description: 'Situacija',
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

    // Generate PDF report images if requested
    const pdfReportImages: AttachmentItem[] = [];
    if (metaData.includePdfs) {
        try {
            const { generateBulkPDFAsBlob } = await import('../../lib/pdfGenerator');
            const pdfBlob = await traceAsync('generatePDF', 'export.pdf', () =>
                generateBulkPDFAsBlob(reports, userProfile as Profile | undefined, metaData.exportLanguage || 'hr')
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

    return {
        construction,
        customer,
        userProfile,
        attachments,
        pdfReportImages,
        imageMap,
        imageDimensions,
        contentTable,
    };
};
