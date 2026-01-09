import { supabase } from '../lib/supabase';

export interface Certifier {
    id: string;
    name: string;
    title?: string;
    is_default?: boolean;
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
    }
};
