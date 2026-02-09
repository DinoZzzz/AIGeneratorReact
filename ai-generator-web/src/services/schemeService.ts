import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { SchemeImage } from '../types';

const BUCKET_NAME = 'scheme-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
type SchemeMethodType = SchemeImage['method_type'];

/**
 * Get all scheme images from the database
 */
export const getSchemeImages = async (): Promise<SchemeImage[]> => {
    try {
        const { data, error } = await supabase
            .from('scheme_images')
            .select('*')
            .order('scheme_number', { ascending: true });

        if (error) {
            captureError(error, { service: 'schemeService', method: 'getSchemeImages' });
            throw error;
        }

        return data || [];
    } catch (error) {
        captureError(error instanceof Error ? error : new Error('Error fetching scheme images'), { service: 'schemeService', method: 'getSchemeImages' });
        return [];
    }
};

const buildSchemeFilter = (
    schemeNumber: number,
    methodType?: SchemeMethodType
) => {
    let query = supabase
        .from('scheme_images')
        .select('*')
        .eq('scheme_number', schemeNumber);

    if (methodType) {
        query = query.eq('method_type', methodType);
    }

    return query;
};

const isFilePathShared = async (filePath: string, excludeSchemeId?: string): Promise<boolean> => {
    let query = supabase
        .from('scheme_images')
        .select('id', { count: 'exact', head: true })
        .eq('file_path', filePath);

    if (excludeSchemeId) {
        query = query.neq('id', excludeSchemeId);
    }

    const { count, error } = await query;
    if (error) {
        captureError(error, { service: 'schemeService', method: 'isFilePathShared', filePath });
        return true;
    }

    return (count || 0) > 0;
};

/**
 * Get a single scheme image by scheme number, optionally scoped by method
 */
export const getSchemeImage = async (
    schemeNumber: number,
    methodType?: SchemeMethodType
): Promise<SchemeImage | null> => {
    try {
        const { data, error } = await buildSchemeFilter(schemeNumber, methodType)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            captureError(error, { service: 'schemeService', method: 'getSchemeImage', schemeNumber, methodType });
            throw error;
        }

        return data;
    } catch (error) {
        captureError(error instanceof Error ? error : new Error(`Error fetching scheme ${schemeNumber}`), { service: 'schemeService', method: 'getSchemeImage', schemeNumber, methodType });
        return null;
    }
};

/**
 * Get the URL for a scheme image with fallback to local assets
 */
export const getSchemeImageUrl = async (
    schemeNumber: number,
    methodType?: SchemeMethodType
): Promise<string> => {
    try {
        const scheme = await getSchemeImage(schemeNumber, methodType);

        // If there's a cloud file path, return the public URL
        if (scheme?.file_path) {
            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(scheme.file_path);

            if (data?.publicUrl) {
                return data.publicUrl;
            }
        }

        // Fallback to local asset
        return `/assets/Scheme${schemeNumber}.PNG`;
    } catch (error) {
        captureError(error instanceof Error ? error : new Error(`Error getting scheme ${schemeNumber} URL`), { service: 'schemeService', method: 'getSchemeImageUrl', schemeNumber, methodType });
        // Fallback to local asset
        return `/assets/Scheme${schemeNumber}.PNG`;
    }
};

/**
 * Get the URL for a scheme image by scheme number and method type
 * @param schemeNumber - The scheme number (1-5 for A-E)
 * @param methodType - 'water' or 'air'
 */
export const getSchemeImageUrlByMethod = async (schemeNumber: number, methodType: 'water' | 'air'): Promise<string> => {
    return getSchemeImageUrl(schemeNumber, methodType);
};

/**
 * Validate an image file before upload
 */
export const validateSchemeImage = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            isValid: false,
            error: 'Nepodržani format. Koristite PNG, JPG ili WebP.'
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: 'Datoteka je prevelika. Maksimum je 5MB.'
        };
    }

    return { isValid: true };
};

/**
 * Upload a new scheme image
 */
export const uploadSchemeImage = async (
    schemeNumber: number,
    file: File,
    methodType?: SchemeMethodType
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validate file
        const validation = validateSchemeImage(file);
        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        // Get current user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Niste prijavljeni' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('name, last_name')
            .eq('id', user.id)
            .single();

        const uploaderName = profile
            ? `${profile.name} ${profile.last_name}`.trim()
            : user.email || 'Unknown';

        // Get current scheme to check for existing file
        const currentScheme = await getSchemeImage(schemeNumber, methodType);

        // Delete old file if exists
        if (currentScheme?.file_path) {
            const isShared = await isFilePathShared(currentScheme.file_path, currentScheme.id);
            if (!isShared) {
                await supabase.storage
                    .from(BUCKET_NAME)
                    .remove([currentScheme.file_path]);
            }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const timestamp = Date.now();
        const methodSuffix = methodType ? `_${methodType}` : '';
        const fileName = `scheme_${schemeNumber}${methodSuffix}_${timestamp}.${fileExt}`;

        // Upload new file
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            captureError(uploadError, { service: 'schemeService', method: 'uploadSchemeImage', schemeNumber, methodType });
            return { success: false, error: uploadError.message };
        }

        // Update database record
        let updateQuery = supabase
            .from('scheme_images')
            .update({
                file_path: fileName,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
                updated_by_name: uploaderName
            })
            .eq('scheme_number', schemeNumber);

        if (methodType) {
            updateQuery = updateQuery.eq('method_type', methodType);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
            // Rollback: delete uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([fileName]);
            captureError(updateError, { service: 'schemeService', method: 'uploadSchemeImage', schemeNumber, methodType, step: 'dbUpdate' });
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error) {
        captureError(error instanceof Error ? error : new Error('Scheme image upload failed'), { service: 'schemeService', method: 'uploadSchemeImage', schemeNumber, methodType });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Update scheme metadata (name and description)
 */
export const updateSchemeMetadata = async (
    schemeNumber: number,
    name: string,
    description: string,
    methodType?: SchemeMethodType
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Niste prijavljeni' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('name, last_name')
            .eq('id', user.id)
            .single();

        const uploaderName = profile
            ? `${profile.name} ${profile.last_name}`.trim()
            : user.email || 'Unknown';

        let updateQuery = supabase
            .from('scheme_images')
            .update({
                name,
                description,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
                updated_by_name: uploaderName
            })
            .eq('scheme_number', schemeNumber);

        if (methodType) {
            updateQuery = updateQuery.eq('method_type', methodType);
        }

        const { error } = await updateQuery;

        if (error) {
            captureError(error, { service: 'schemeService', method: 'updateSchemeMetadata', schemeNumber, methodType });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        captureError(error instanceof Error ? error : new Error('Scheme metadata update failed'), { service: 'schemeService', method: 'updateSchemeMetadata', schemeNumber, methodType });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Reset a scheme image to default (remove cloud image)
 */
export const resetSchemeImage = async (
    schemeNumber: number,
    methodType?: SchemeMethodType
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Niste prijavljeni' };
        }

        // Get current scheme
        const currentScheme = await getSchemeImage(schemeNumber, methodType);

        // Delete cloud file if exists
        if (currentScheme?.file_path) {
            const isShared = await isFilePathShared(currentScheme.file_path, currentScheme.id);
            if (!isShared) {
                await supabase.storage
                    .from(BUCKET_NAME)
                    .remove([currentScheme.file_path]);
            }
        }

        // Update database to remove file_path
        let updateQuery = supabase
            .from('scheme_images')
            .update({
                file_path: null,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('scheme_number', schemeNumber);

        if (methodType) {
            updateQuery = updateQuery.eq('method_type', methodType);
        }

        const { error } = await updateQuery;

        if (error) {
            captureError(error, { service: 'schemeService', method: 'resetSchemeImage', schemeNumber, methodType });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        captureError(error instanceof Error ? error : new Error('Scheme image reset failed'), { service: 'schemeService', method: 'resetSchemeImage', schemeNumber, methodType });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Get public URL for a scheme image file path
 */
export const getSchemePublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return data?.publicUrl || '';
};
