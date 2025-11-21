import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportForm } from '../types';
import * as calc from './calculations/report';

export const generatePDF = (report: Partial<ReportForm>) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Water Tightness Test Report', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date: ${report.examination_date}`, 20, 40);
    doc.text(`Report ID: ${report.id || 'New Report'}`, 20, 48);

    // Calculate values for display
    const waterLoss = calc.calculateWaterLoss(report.water_height_start || 0, report.water_height_end || 0);
    const waterVolumeLoss = calc.calculateWaterVolumeLoss(
        waterLoss,
        report.material_type_id || 1,
        report.pane_diameter || 0,
        report.pane_width || 0,
        report.pane_length || 0
    );

    const wettedShaft = calc.calculateWettedShaftSurface(
        report.draft_id || 1,
        report.material_type_id || 1,
        report.water_height || 0,
        report.pane_diameter || 0,
        report.pane_width || 0,
        report.pane_length || 0
    );

    const wettedPipe = calc.calculateWettedPipeSurface(
        report.draft_id || 1,
        report.pipe_diameter || 0,
        report.pipe_length || 0
    );

    const totalWettedArea = calc.calculateTotalWettedArea(wettedPipe, wettedShaft);
    const criteria = calc.getCriteria(report.draft_id || 1);
    const allowedLossL = calc.calculateAllowedLossL(criteria, totalWettedArea);
    const result = calc.calculateResult(waterVolumeLoss, totalWettedArea);
    const satisfies = calc.isSatisfying(result, criteria, 1);

    // Basic Info Table
    autoTable(doc, {
        startY: 60,
        head: [['Parameter', 'Value']],
        body: [
            ['Draft Type', report.draft_id === 1 ? 'Testing of Shaft' : report.draft_id === 2 ? 'Testing of Pipe' : 'Testing of Shaft and Pipe'],
            ['Material Type', report.material_type_id === 1 ? 'Shaft (Round)' : 'Pipe (Rectangular)'],
            ['Temperature', `${report.temperature}°C`],
            ['Water Height', `${report.water_height} m`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [66, 135, 245] }
    });

    // Dimensions Table
    autoTable(doc, {
        startY: (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 10,
        head: [['Dimensions', 'Value']],
        body: [
            ['Pane Diameter', report.pane_diameter ? `${report.pane_diameter} m` : '-'],
            ['Pane Width', report.pane_width ? `${report.pane_width} m` : '-'],
            ['Pane Length', report.pane_length ? `${report.pane_length} m` : '-'],
            ['Pipe Diameter', report.pipe_diameter ? `${report.pipe_diameter} m` : '-'],
            ['Pipe Length', report.pipe_length ? `${report.pipe_length} m` : '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [66, 135, 245] }
    });

    // Results Table
    autoTable(doc, {
        startY: (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 10,
        head: [['Results', 'Value']],
        body: [
            ['Start Water Level', `${report.water_height_start} mm`],
            ['End Water Level', `${report.water_height_end} mm`],
            ['Water Loss', `${waterLoss.toFixed(2)} mm`],
            ['Volume Loss', `${waterVolumeLoss.toFixed(4)} l`],
            ['Total Wetted Area', `${totalWettedArea.toFixed(2)} m²`],
            ['Allowed Loss', `${allowedLossL.toFixed(2)} l`],
            ['Result', `${result.toFixed(2)} l/m²`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [66, 135, 245] }
    });

    // Final Verdict
    const finalY = (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');

    if (satisfies) {
        doc.setTextColor(0, 128, 0); // Green
        doc.text('RESULT: SATISFIES', 105, finalY, { align: 'center' });
    } else {
        doc.setTextColor(255, 0, 0); // Red
        doc.text('RESULT: DOES NOT SATISFY', 105, finalY, { align: 'center' });
    }

    // Save
    doc.save(`report_${report.id || 'new'}.pdf`);
};

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}
