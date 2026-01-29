import { supabase } from '../lib/supabase';
import type { SchemeImage } from '../types';

const BUCKET_NAME = 'scheme-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Get all scheme images from the database
 */
export const getSchemeImages = async (): Promise<SchemeImage[]> => {
    try {
        const { data, error } = await supabase
            .from('scheme_images')
            .select('*')
            .order('scheme_number', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching scheme images:', error);
        return [];
    }
};

/**
 * Get a single scheme image by scheme number
 */
export const getSchemeImage = async (schemeNumber: number): Promise<SchemeImage | null> => {
    try {
        const { data, error } = await supabase
            .from('scheme_images')
            .select('*')
            .eq('scheme_number', schemeNumber)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error(`Error fetching scheme ${schemeNumber}:`, error);
        return null;
    }
};

/**
 * Get the URL for a scheme image with fallback to local assets
 */
export const getSchemeImageUrl = async (schemeNumber: number): Promise<string> => {
    try {
        const scheme = await getSchemeImage(schemeNumber);

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
        console.error(`Error getting scheme ${schemeNumber} URL:`, error);
        // Fallback to local asset
        return `/assets/Scheme${schemeNumber}.PNG`;
    }
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
    file: File
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
        const currentScheme = await getSchemeImage(schemeNumber);

        // Delete old file if exists
        if (currentScheme?.file_path) {
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([currentScheme.file_path]);
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const timestamp = Date.now();
        const fileName = `scheme_${schemeNumber}_${timestamp}.${fileExt}`;

        // Upload new file
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        // Update database record
        const { error: updateError } = await supabase
            .from('scheme_images')
            .update({
                file_path: fileName,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
                updated_by_name: uploaderName
            })
            .eq('scheme_number', schemeNumber);

        if (updateError) {
            // Rollback: delete uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([fileName]);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Update scheme metadata (name and description)
 */
export const updateSchemeMetadata = async (
    schemeNumber: number,
    name: string,
    description: string
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

        const { error } = await supabase
            .from('scheme_images')
            .update({
                name,
                description,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
                updated_by_name: uploaderName
            })
            .eq('scheme_number', schemeNumber);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Reset a scheme image to default (remove cloud image)
 */
export const resetSchemeImage = async (
    schemeNumber: number
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Niste prijavljeni' };
        }

        // Get current scheme
        const currentScheme = await getSchemeImage(schemeNumber);

        // Delete cloud file if exists
        if (currentScheme?.file_path) {
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([currentScheme.file_path]);
        }

        // Update database to remove file_path
        const { error } = await supabase
            .from('scheme_images')
            .update({
                file_path: null,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('scheme_number', schemeNumber);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
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
