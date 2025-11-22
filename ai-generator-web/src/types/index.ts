export interface MaterialType {
    id: number;
    name: string;
}

export interface Material {
    id: number;
    material_type_id: number;
    name: string;
}

export interface ReportDraft {
    id: number;
    name: string;
    draft_type?: string;
}

export interface ExaminationProcedure {
    id: number;
    name: string;
    allowed_loss: number;
}

export interface Customer {
    id: string;
    name: string;
    work_order?: string;
    location?: string;
    address?: string;
    postal_code?: string;
    oib?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    created_at: string;
}

export interface Construction {
    id: string;
    customer_id: string;
    work_order?: string;
    name: string;
    location?: string;
    is_active: boolean;
    created_at: string;
    customer?: Customer; // Joined
}

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface ReportForm {
    id: string;
    ordinal: number;
    user_id: string;
    type_id: number; // 1 = Water, 2 = Air
    draft_id: number;
    stock?: string;
    examination_procedure_id?: number;
    customer_id?: string;
    construction_id?: string;

    // Measurements
    temperature: number;
    pane_material_id?: number;
    material_type_id?: number;
    pipe_material_id?: number;
    pipe_length: number;
    pipe_diameter: number;
    pipeline_slope: number;
    pane_width: number;
    pane_height: number;
    pane_length: number;
    saturation_of_test_section: number;
    water_height: number;
    water_height_start: number;
    water_height_end: number;
    pressure_start: number;
    pressure_end: number;
    ro_height: number;
    pane_diameter: number;
    depositional_height: number;

    // Times
    stabilization_time?: string;
    saturation_time?: string;
    examination_date: string;
    examination_duration?: string; // Interval string from Postgres
    examination_start_time?: string;
    examination_end_time?: string;

    // Results
    satisfies: boolean;
    remark?: string;
    deviation?: string;

    created_at: string;
    updated_at: string;

    // Joined fields
    construction?: Construction;
    draft?: ReportDraft;
}

export interface ReportExport {
    id: string;
    type_id: number;
    construction_id: string;
    customer_id: string;
    certifier_id: string;
    user_id: string;
    drainage?: string;
    water_remark?: string;
    water_deviation?: string;
    air_remark?: string;
    air_deviation?: string;
    is_finished: boolean;
    certification_time: string;
    examination_date: string;
    construction_part: string;
    created_at: string;
    updated_at: string;

    // Joined
    certifier?: User;
    user?: User;
    forms_count?: number;
}

export interface ReportExportForm {
    id: string;
    type_id: number;
    form_id: string;
    report_form?: ReportForm;
    export_id: string;
    ordinal: number;
    created_at: string;
    updated_at: string;
}
