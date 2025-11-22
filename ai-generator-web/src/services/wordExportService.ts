import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import type { ReportForm } from '../types';
import type { ExportMetaData } from '../components/ExportDialog';
import {
    calculatePressureLoss,
    calculateWaterVolumeLoss,
    calculateAllowedLossL,
    calculateResult,
    calculateTotalWettedArea
} from '../lib/calculations/report';
import { supabase } from '../lib/supabase';

// Function to load file from url
const loadFile = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
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
    return num.toFixed(decimals);
};

export const generateWordDocument = async (reports: ReportForm[], metaData: ExportMetaData) => {
    try {
        // 1. Load the template
        const templateContent = await loadFile('/templates/method1610.docx');

        // 2. Prepare the zip
        const zip = new PizZip(templateContent);

        // 3. Create docxtemplater instance
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // 4. Prepare data
        if (reports.length === 0) throw new Error("No reports selected");

        const firstReport = reports[0];

        // Fetch Construction and Customer data if missing
        // This addresses the "Unsafe Type Casting" issue by ensuring we have data.
        let construction: any = (firstReport as any).construction;
        let customer: any = construction?.customer;

        if (!construction && firstReport.construction_id) {
             const { data: constr } = await supabase
                .from('customer_constructions')
                .select('*, customer:customers(*)')
                .eq('id', firstReport.construction_id)
                .single();

             if (constr) {
                 construction = constr;
                 customer = constr.customer;
             }
        }

        // Fetch Procedure data for all air reports if missing
        // This is needed for the table
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

        // Fetch Material Names if missing (for summary)
        // Optimally we'd have a materials table map
        // For now, we'll try to fetch if we can, otherwise fallback to ID
        // Assuming we can't easily fetch all material names without a 'materials' table reference which might be 'material_types' or 'materials'
        // We will leave the IDs or try to fetch if we knew the table.
        // Based on 'cbMaterialType' in C#, there is IMaterialType and IMaterial.
        // Let's attempt to fetch from 'materials' if it exists, otherwise ignore.
        // We'll skip this to avoid breaking if table doesn't exist, as it's less critical than Construction/Customer.


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
                    pressureLoss: formatNum(calculatePressureLoss(r), 2),
                    constVal: "0.23"
                };
            });

        // Prepare Water Method Table Data
        const waterReports = reports
            .filter(r => r.type_id === 1) // Water
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((r, index) => ({
                ordinal: index + 1,
                stock: r.stock || '-',
                allowedLoss: formatNum(calculateAllowedLossL(r), 2),
                waterVolumeLoss: formatNum(calculateWaterVolumeLoss(r), 2),
                result: formatNum(calculateResult(r), 2)
            }));

        const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => (r as any).pipe_material?.name || r.pipe_material_id))).join(', ');
        const uniquePaneMaterials = Array.from(new Set(reports.map(r => (r as any).pane_material?.name || r.pane_material_id))).join(', ');

        const uniquePipeDiameters = Array.from(new Set(pipeReports.map(r => `ø ${r.pipe_diameter * 1000}`))).join(', ');
        const uniquePaneDiameters = Array.from(new Set(reports.map(r => `ø ${r.pane_diameter * 1000}`))).join(', ');


        // 5. Set the data matching the Mustache tags in the docx template
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
            hasAirTests: airReports.length > 0,
            hasWaterTests: waterReports.length > 0,
            hasPaneInfo: uniquePaneDiameters.length > 0,
            hasTubeInfo: uniquePipeDiameters.length > 0,

            // Tables
            airTests: airReports,
            waterTests: waterReports,

            // Result
            satisfies: satisfies ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA",
            isUnsatisfied: !satisfies,
            unsatisfiedStocks: satisfies
                ? "Sve dionice zadovoljavaju uvjete vodonepropusnosti."
                : "Dionice " + reports.filter(r => !r.satisfies).map(r => r.stock).join(", ") + " ne zadovoljavaju uvjete vodonepropusnosti.",

            // Tech details
            tubeMaterials: uniquePipeMaterials,
            tubeDiameters: uniquePipeDiameters,
            paneMaterials: uniquePaneMaterials,
            paneDiameters: uniquePaneDiameters,
        });

        // 6. Output the document
        const blob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // 7. Save
        saveAs(blob, `${metaData.constructionPart || 'Report'}_${new Date().getTime()}.docx`);

    } catch (error) {
        console.error("Error generating document:", error);
        throw error;
    }
};
