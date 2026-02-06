import type { ReportForm, Construction, Customer, Profile, ReportFile, Material, ExaminationProcedure } from '../../types';

export interface AirReportRow {
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

export interface WaterReportRow {
    isSection: boolean;
    isReport: boolean;
    sectionName?: string;
    ordinal: string | number;
    stock: string;
    allowedLoss: string;
    waterVolumeLoss: string;
    result: string;
}

export interface AttachmentItem {
    path: string;
    name: string;
    description: string;
    image: string;
}

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface DocxTemplaterError {
    properties?: {
        errors?: Array<{
            message: string;
            part: string;
            offset: number;
            context: string;
        }>;
    };
}

export type ReportFormWithJoins = ReportForm & {
    examination_procedure?: ExaminationProcedure;
    pipe_material?: Material;
    pane_material?: Material;
};

export type ConstructionPartial = Pick<Construction, 'id' | 'name' | 'location' | 'customer_id'> & { work_order?: string };
export type CustomerPartial = Pick<Customer, 'id' | 'name' | 'address' | 'location'>;
export type ProfilePartial = Pick<Profile, 'id' | 'name' | 'last_name' | 'gender' | 'title'>;
export type ReportFilePartial = Pick<ReportFile, 'id' | 'file_name' | 'file_path' | 'description' | 'construction_id'>;
export type MaterialPartial = { id: number; name: string };

export interface PreparedDocumentData {
    construction: ConstructionPartial | null;
    customer: CustomerPartial | null;
    userProfile: ProfilePartial | null;
    attachments: AttachmentItem[];
    pdfReportImages: AttachmentItem[];
    imageMap: Record<string, ArrayBuffer>;
    imageDimensions: Record<string, ImageDimensions>;
    contentTable: string;
}
