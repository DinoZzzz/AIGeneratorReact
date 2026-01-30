import { supabase } from '../lib/supabase';

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

        if (error) throw error;
        return data || [];
    },

    async create(certifier: Omit<Certifier, 'id' | 'created_at'>): Promise<Certifier> {
        const { data, error } = await supabase
            .from('certifiers')
            .insert([certifier])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Omit<Certifier, 'id' | 'created_at'>>): Promise<Certifier> {
        const { data, error } = await supabase
            .from('certifiers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('certifiers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async setDefault(id: string): Promise<void> {
        // First, unset all defaults
        await supabase
            .from('certifiers')
            .update({ is_default: false })
            .neq('id', id);

        // Then set the new default
        const { error } = await supabase
            .from('certifiers')
            .update({ is_default: true })
            .eq('id', id);

        if (error) throw error;
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
    },

    // Delete signature for a certifier
    async deleteSignature(certifierId: string): Promise<void> {
        // Get current certifier to find signature file
        const { data: certifier } = await supabase
            .from('certifiers')
            .select('signature_url')
            .eq('id', certifierId)
            .single();

        if (certifier?.signature_url) {
            // Extract filename from URL
            const fileName = certifier.signature_url.split('/').pop();
            if (fileName) {
                // Delete from storage
                await supabase.storage
                    .from('certifier-signatures')
                    .remove([fileName]);
            }
        }

        // Clear signature_url in database
        const { error } = await supabase
            .from('certifiers')
            .update({ signature_url: null })
            .eq('id', certifierId);

        if (error) throw error;
    }
};
