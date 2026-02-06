import type { ExaminationProcedure, Material } from '../../types';
import type { AirReportRow, WaterReportRow, ReportFormWithJoins, MaterialPartial } from './types';
import { supabase } from '../../lib/supabase';
import { formatNum } from './helpers';
import {
    calculatePressureLoss,
    calculateWaterVolumeLoss,
    calculateAllowedLossL,
    calculateResult,
    calculateTotalWettedArea,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface
} from '../../lib/calculations/report';

export const enrichReports = async (reportsWithJoins: ReportFormWithJoins[]): Promise<void> => {
    // Fetch Procedure data for air reports if missing
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
};

export const buildAirReportRows = (reportsWithJoins: ReportFormWithJoins[]): AirReportRow[] => {
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

    return airReports;
};

export const buildWaterReportRows = (reportsWithJoins: ReportFormWithJoins[]): WaterReportRow[] => {
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

    return waterReports;
};
