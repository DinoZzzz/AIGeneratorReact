import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import type { ReportForm } from '../types';
import type { ExportMetaData } from '../components/ExportDialog';
import {
    calculatePressureLoss,
    calculateWaterVolumeLoss,
    calculateAllowedLossL,
    calculateResult
} from '../lib/calculations';

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
        const construction = firstReport.construction;
        const customer = construction?.customer;

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
        // Note: The template likely uses a loop like {#AirMethods}...{/AirMethods}
        // We need to map our reports to the template structure.
        const airReports = reports
            .filter(r => r.type_id === 2) // Air
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((r, index) => ({
                Ordinal: index + 1,
                Stock: r.stock || '-',
                PipeLength: (r.draft_id === 4 || r.pipe_length === 0) ? '-' : formatNum(r.pipe_length, 2),
                // Needs procedure name and pressure. Using mock if joined data missing.
                PressureInfo: r.pressure_start ? `${r.pressure_start}` : '-', // Improve if procedure joined
                AllowedLoss: '-', // Calculation depends on procedure allowed loss which might be missing in join
                PressureLoss: formatNum(calculatePressureLoss(r), 2),
                // Logic from C#: 0.23 is hardcoded? MSWord.cs says "0.23 + """
                // Checking MSWord.cs: row.Cells[7].Range.Text = 0.23 + "";
                SomeConstant: "0.23"
            }));

        // Prepare Water Method Table Data
        const waterReports = reports
            .filter(r => r.type_id === 1) // Water
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((r, index) => ({
                Ordinal: index + 1,
                Stock: r.stock || '-',
                AllowedLoss: formatNum(calculateAllowedLossL(r), 2),
                WaterVolumeLoss: formatNum(calculateWaterVolumeLoss(r), 2),
                Result: formatNum(calculateResult(r), 2)
            }));

        // Unique materials/diameters for summary
        const uniquePipeMaterials = Array.from(new Set(pipeReports.map(r => r.pipe_material_id))).join(', '); // Just IDs for now, ideally Names
        const uniquePaneMaterials = Array.from(new Set(reports.map(r => r.pane_material_id))).join(', ');
        const uniquePipeDiameters = Array.from(new Set(pipeReports.map(r => `ø ${r.pipe_diameter * 1000}`))).join(', ');
        const uniquePaneDiameters = Array.from(new Set(reports.map(r => `ø ${r.pane_diameter * 1000}`))).join(', ');


        // 5. Set the data
        doc.render({
            Creator: metaData.certifierName || "System", // Or logged in user
            Certifier: metaData.certifierName,
            ConstructionSitePart: metaData.constructionPart || "-",
            CurrentDate: new Date().toLocaleDateString('hr-HR'),
            WorkOrder: construction?.work_order || "-",
            ExaminationDate: dateRange,
            Temperature: tempRange,
            CustomerName: customer?.name || "-",
            ConstructionLocations: construction?.location || "-",
            ConstructionSite: construction?.name || "-",
            CustomerDetailed: customer ? `${customer.name}, ${customer.address || ''} ${customer.location || ''}` : "-",

            // Summary Fields
            RevisionPaneCount: reports.filter(r => r.draft_id !== 3 && r.draft_id !== 6).length + " kom.",
            TubeLengthSum: totalLength === 0 ? "-" : formatNum(totalLength, 2) + " m",
            Drainage: metaData.drainage,

            // Remarks
            AirMethodRemark: metaData.airRemark || "nema",
            AirNormDeviation: metaData.airDeviation || "nema",
            WaterMethodRemark: metaData.waterRemark || "nema",
            WaterNormDeviation: metaData.waterDeviation || "nema",

            // Boolean Flags for conditional showing in template
            ShowAirMethod: airReports.length > 0,
            ShowWaterMethod: waterReports.length > 0,

            // Tables
            AirMethods: airReports,
            WaterMethods: waterReports,

            // Result
            Satisfies: satisfies ? "ZADOVOLJAVA" : "NE ZADOVOLJAVA",
            UnsatisfiedStocks: satisfies
                ? "Sve dionice zadovoljavaju uvjete vodonepropusnosti."
                : "Dionice " + reports.filter(r => !r.satisfies).map(r => r.stock).join(", ") + " ne zadovoljavaju uvjete vodonepropusnosti.",

            // Tech details
            TubeMaterials: uniquePipeMaterials, // Placeholder until we map IDs to names
            TubeDiameters: uniquePipeDiameters,
            PaneMaterials: uniquePaneMaterials,
            PaneDiameters: uniquePaneDiameters,
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
