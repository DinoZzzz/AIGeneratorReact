import PizZip from 'pizzip';
import type { TemplateInfo, TemplateValidationResult } from '../types';
import { supabase } from '../lib/supabase';

// Required tags that must be in the template
const REQUIRED_TAGS = [
    'certifier',
    'currentDate',
    'workOrder'
];

// Recommended tags (warning if missing)
const RECOMMENDED_TAGS = [
    'customerName',
    'constructionSite',
    'satisfies',
    '#airTests',
    '/airTests',
    '#waterTests',
    '/waterTests'
];

// All known tags for recognition
const KNOWN_TAGS = [
    'creator', 'certifier', 'constructionSitePart', 'currentDate', 'workOrder',
    'examinationDate', 'temperature', 'customerName', 'constructionLocations',
    'constructionSite', 'customerDetailed', 'revisionPaneCount', 'tubeLengthSum',
    'drainage', 'airMethodRemark', 'airNormDeviation', 'waterMethodRemark',
    'waterNormDeviation', 'hasAirTests', 'hasWaterTests', 'hasPaneInfo',
    'hasTubeInfo', 'airTests', 'waterTests', 'airReports', 'waterReports',
    'airMethodTableName', 'waterMethodTableName', 'satisfies', 'airMethodSatisfies',
    'waterMethodCriteria', 'isUnsatisfied', 'unsatisfiedStocks', 'tubeMaterials',
    'tubeDiameters', 'paneMaterials', 'paneDiameters', 'contentTable',
    'hasAttachments', 'attachments', 'Attachments', 'izradioLabel', 'pregledaoLabel',
    '#airTests', '/airTests', '#waterTests', '/waterTests', '#attachments',
    '/attachments', '#hasAirTests', '/hasAirTests', '#hasWaterTests', '/hasWaterTests',
    '#hasAttachments', '/hasAttachments', '#isUnsatisfied', '/isUnsatisfied',
    // Loop variables
    'ordinal', 'stock', 'pipeLength', 'procedureInfo', 'allowedLoss',
    'pressureLoss', 'uncertainty', 'waterVolumeLoss', 'result', 'isSection',
    'isReport', 'sectionName', 'image', 'description', 'path', 'name'
];

/**
 * Get information about the current active template
 */
export const getActiveTemplate = async (): Promise<TemplateInfo | null> => {
    try {
        const { data: files, error } = await supabase.storage
            .from('templates')
            .list('', { limit: 10, sortBy: { column: 'updated_at', order: 'desc' } });

        if (error) throw error;

        // Find the active template (method1610.docx)
        const activeFile = files?.find((f: { name: string }) => f.name === 'method1610.docx');

        if (!activeFile) return null;

        // Get metadata including uploader info
        const { data: metadata } = await supabase
            .from('template_metadata')
            .select('uploaded_by_name, uploaded_at')
            .eq('file_name', 'method1610.docx')
            .eq('is_active', true)
            .single();

        return {
            name: activeFile.name,
            path: activeFile.name,
            size: activeFile.metadata?.size || 0,
            lastUpdated: metadata?.uploaded_at || activeFile.updated_at || activeFile.created_at || new Date().toISOString(),
            updatedBy: metadata?.uploaded_by_name
        };
    } catch (error) {
        console.error('Error getting active template:', error);
        return null;
    }
};

/**
 * Extract tags from a docx file content
 */
const extractTagsFromDocx = (zip: PizZip): string[] => {
    const tags: string[] = [];
    const tagRegex = /\{([#/]?[a-zA-Z_][a-zA-Z0-9_]*)\}/g;

    // Check document.xml for tags
    const docXml = zip.file('word/document.xml');
    if (docXml) {
        const content = docXml.asText();
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            if (!tags.includes(match[1])) {
                tags.push(match[1]);
            }
        }
    }

    // Also check header and footer files
    const headerFooterFiles = Object.keys(zip.files).filter(
        name => name.startsWith('word/header') || name.startsWith('word/footer')
    );

    for (const fileName of headerFooterFiles) {
        const file = zip.file(fileName);
        if (file) {
            const content = file.asText();
            let match;
            while ((match = tagRegex.exec(content)) !== null) {
                if (!tags.includes(match[1])) {
                    tags.push(match[1]);
                }
            }
        }
    }

    return tags;
};

/**
 * Validate a template file
 */
export const validateTemplate = async (file: File): Promise<TemplateValidationResult> => {
    const result: TemplateValidationResult = {
        isValid: false,
        foundTags: [],
        missingTags: [],
        unrecognizedTags: [],
        errors: []
    };

    try {
        // Check file extension
        if (!file.name.toLowerCase().endsWith('.docx')) {
            result.errors.push('File must be a .docx Word document');
            return result;
        }

        // Read file content
        const arrayBuffer = await file.arrayBuffer();

        // Try to parse as zip
        let zip: PizZip;
        try {
            zip = new PizZip(arrayBuffer);
        } catch {
            result.errors.push('File is not a valid ZIP archive (corrupted or not a real .docx)');
            return result;
        }

        // Check for document.xml
        if (!zip.files['word/document.xml']) {
            result.errors.push('File is missing word/document.xml - not a valid Word document');
            return result;
        }

        // Extract tags from document
        const foundTags = extractTagsFromDocx(zip);
        result.foundTags = foundTags;

        // Check for required tags
        for (const tag of REQUIRED_TAGS) {
            if (!foundTags.includes(tag)) {
                result.missingTags.push(tag);
            }
        }

        // Check for recommended tags (just for info)
        for (const tag of RECOMMENDED_TAGS) {
            if (!foundTags.includes(tag) && !result.missingTags.includes(tag)) {
                // Add to missing but mark as recommended (we won't fail on these)
            }
        }

        // Check for unrecognized tags
        for (const tag of foundTags) {
            // Remove # and / prefixes for comparison
            const cleanTag = tag.replace(/^[#/]/, '');
            if (!KNOWN_TAGS.includes(tag) && !KNOWN_TAGS.includes(cleanTag)) {
                result.unrecognizedTags.push(tag);
            }
        }

        // Template is valid if no errors and no missing required tags
        result.isValid = result.errors.length === 0 && result.missingTags.length === 0;

        return result;
    } catch (error: any) {
        result.errors.push(`Validation error: ${error.message}`);
        return result;
    }
};

/**
 * Upload a new template
 */
export const uploadTemplate = async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validate first
        const validation = await validateTemplate(file);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.errors.length > 0
                    ? validation.errors.join(', ')
                    : `Missing required tags: ${validation.missingTags.join(', ')}`
            };
        }

        // Backup current template
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupName = `method1610_backup_${timestamp}.docx`;

        // Copy current to backup
        const { data: currentData } = supabase.storage
            .from('templates')
            .getPublicUrl('method1610.docx');

        if (currentData.publicUrl) {
            try {
                const response = await fetch(currentData.publicUrl);
                if (response.ok) {
                    const currentBlob = await response.blob();
                    await supabase.storage
                        .from('templates')
                        .upload(backupName, currentBlob, { upsert: false });
                }
            } catch (e) {
                console.warn('Could not backup current template:', e);
            }
        }

        // Upload new template
        const { error: uploadError } = await supabase.storage
            .from('templates')
            .upload('method1610.docx', file, { upsert: true });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        // Record uploader info
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
                .from('profiles')
                .select('name, last_name')
                .eq('id', user?.id)
                .single();

            const uploaderName = profile ? `${profile.name} ${profile.last_name}`.trim() : user?.email || 'Unknown';

            // Mark all as inactive first
            await supabase
                .from('template_metadata')
                .update({ is_active: false })
                .eq('file_name', 'method1610.docx');

            // Insert new metadata record
            await supabase
                .from('template_metadata')
                .insert({
                    file_name: 'method1610.docx',
                    uploaded_by: user?.id,
                    uploaded_by_name: uploaderName,
                    is_active: true
                });
        } catch (e) {
            console.warn('Could not record template metadata:', e);
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * List previous template versions (backups)
 */
export const listTemplateVersions = async (): Promise<TemplateInfo[]> => {
    try {
        const { data: files, error } = await supabase.storage
            .from('templates')
            .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

        if (error) throw error;

        // Filter for backup files only
        const backups = files
            ?.filter((f: { name: string }) => f.name.startsWith('method1610_backup_'))
            .map((f: { name: string; metadata?: { size?: number }; created_at?: string }) => ({
                name: f.name,
                path: f.name,
                size: f.metadata?.size || 0,
                lastUpdated: f.created_at || new Date().toISOString()
            })) || [];

        return backups;
    } catch (error) {
        console.error('Error listing template versions:', error);
        return [];
    }
};

/**
 * Rollback to a previous template version
 */
export const rollbackTemplate = async (backupPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Download the backup
        const { data, error } = await supabase.storage
            .from('templates')
            .download(backupPath);

        if (error || !data) {
            return { success: false, error: error?.message || 'Could not download backup' };
        }

        // Backup current before rollback
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupName = `method1610_backup_${timestamp}.docx`;

        const { data: currentUrl } = supabase.storage
            .from('templates')
            .getPublicUrl('method1610.docx');

        if (currentUrl.publicUrl) {
            try {
                const response = await fetch(currentUrl.publicUrl);
                if (response.ok) {
                    const currentBlob = await response.blob();
                    await supabase.storage
                        .from('templates')
                        .upload(backupName, currentBlob, { upsert: false });
                }
            } catch (e) {
                console.warn('Could not backup current template before rollback:', e);
            }
        }

        // Upload the backup as the active template
        const { error: uploadError } = await supabase.storage
            .from('templates')
            .upload('method1610.docx', data, { upsert: true });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Delete a backup template
 */
export const deleteTemplateBackup = async (backupPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Prevent deleting the active template
        if (backupPath === 'method1610.docx') {
            return { success: false, error: 'Cannot delete the active template' };
        }

        const { error } = await supabase.storage
            .from('templates')
            .remove([backupPath]);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
