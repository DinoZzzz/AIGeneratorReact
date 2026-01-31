import { supabase } from '../lib/supabase';
import { captureError, traceAsync } from '../lib/sentry';

export interface Certifier {
    id: string;
    name: string;
    title?: string;
    is_default?: boolean;
    signature_url?: string;
    created_at?: string;
}

export const certifierService = {
    async getAll(): Promise<Certifier[]> {
        const { data, error } = await supabase
            .from('certifiers')
            .select('*')
            .order('is_default', { ascending: false })
            .order('name');

        if (error) {
            captureError(error, { service: 'certifierService', method: 'getAll' });
            throw error;
        }
        return data || [];
    },

    async create(certifier: Omit<Certifier, 'id' | 'created_at'>): Promise<Certifier> {
        const { data, error } = await supabase
            .from('certifiers')
            .insert([certifier])
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'certifierService', method: 'create', name: certifier.name });
            throw error;
        }
        return data;
    },

    async update(id: string, updates: Partial<Omit<Certifier, 'id' | 'created_at'>>): Promise<Certifier> {
        const { data, error } = await supabase
            .from('certifiers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'certifierService', method: 'update', id });
            throw error;
        }
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('certifiers')
            .delete()
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'certifierService', method: 'delete', id });
            throw error;
        }
    },

    async setDefault(id: string): Promise<void> {
        // First, unset all defaults
        const { error: unsetError } = await supabase
            .from('certifiers')
            .update({ is_default: false })
            .neq('id', id);

        if (unsetError) {
            captureError(unsetError, { service: 'certifierService', method: 'setDefault', step: 'unsetAll', id });
            throw unsetError;
        }

        // Then set the new default
        const { error } = await supabase
            .from('certifiers')
            .update({ is_default: true })
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'certifierService', method: 'setDefault', step: 'setNew', id });
            throw error;
        }
    },

    // Get display name (name + title if exists)
    getDisplayName(certifier: Certifier): string {
        if (certifier.title) {
            return `${certifier.name} ${certifier.title}`;
        }
        return certifier.name;
    },

    // Upload signature image for a certifier
    async uploadSignature(certifierId: string, file: File): Promise<string> {
        return traceAsync('uploadSignature', 'storage.upload', async () => {
            try {
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
                const fileName = `signature-${certifierId}-${Date.now()}.${fileExt}`;

                // First, get current certifier to check for existing signature
                const { data: certifier } = await supabase
                    .from('certifiers')
                    .select('signature_url')
                    .eq('id', certifierId)
                    .single();

                // Delete old signature file if exists
                if (certifier?.signature_url) {
                    const oldFileName = certifier.signature_url.split('/').pop();
                    if (oldFileName) {
                        await supabase.storage
                            .from('certifier-signatures')
                            .remove([oldFileName]);
                    }
                }

                // Upload new signature
                const { error: uploadError } = await supabase.storage
                    .from('certifier-signatures')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('certifier-signatures')
                    .getPublicUrl(fileName);

                // Update certifier record with new signature URL
                const { error: updateError } = await supabase
                    .from('certifiers')
                    .update({ signature_url: urlData.publicUrl })
                    .eq('id', certifierId);

                if (updateError) throw updateError;

                return urlData.publicUrl;
            } catch (error) {
                captureError(error instanceof Error ? error : new Error('Signature upload failed'), {
                    service: 'certifierService',
                    method: 'uploadSignature',
                    certifierId,
                    fileName: file.name
                });
                throw error;
            }
        }, { certifierId });
    },

    // Delete signature for a certifier
    async deleteSignature(certifierId: string): Promise<void> {
        try {
            // Get current certifier to find signature file
            const { data: certifier, error: fetchError } = await supabase
                .from('certifiers')
                .select('signature_url')
                .eq('id', certifierId)
                .single();

            if (fetchError) {
                captureError(fetchError, { service: 'certifierService', method: 'deleteSignature', step: 'fetch', certifierId });
                throw fetchError;
            }

            if (certifier?.signature_url) {
                // Extract filename from URL
                const fileName = certifier.signature_url.split('/').pop();
                if (fileName) {
                    // Delete from storage
                    const { error: storageError } = await supabase.storage
                        .from('certifier-signatures')
                        .remove([fileName]);

                    if (storageError) {
                        captureError(storageError, { service: 'certifierService', method: 'deleteSignature', step: 'storage', certifierId });
                        // Continue to clear DB even if storage delete fails
                    }
                }
            }

            // Clear signature_url in database
            const { error } = await supabase
                .from('certifiers')
                .update({ signature_url: null })
                .eq('id', certifierId);

            if (error) {
                captureError(error, { service: 'certifierService', method: 'deleteSignature', step: 'dbUpdate', certifierId });
                throw error;
            }
        } catch (error) {
            captureError(error instanceof Error ? error : new Error('Signature deletion failed'), {
                service: 'certifierService',
                method: 'deleteSignature',
                certifierId
            });
            throw error;
        }
    }
};
