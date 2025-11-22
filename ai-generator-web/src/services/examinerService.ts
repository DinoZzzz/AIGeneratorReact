import { supabase } from '../lib/supabase';
import type { Profile, ReportType } from '../types';

export const examinerService = {
    async getExaminers(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('name');

        if (error) throw error;

        // Map snake_case DB fields to camelCase TS interface if necessary,
        // or ensure Types/DB match.
        // In types/index.ts we defined Profile with snake_case 'last_name' but camelCase 'lastName' in previous version.
        // I updated types/index.ts to have 'last_name' and optional 'lastName' map if needed.
        // Ideally we just use the DB shape.

        return data.map((p: any) => ({
            ...p,
            lastName: p.last_name, // Compatibility mapping
            isAdmin: p.role === 'admin'
        })) as Profile[];
    },

    async getReportTypes(): Promise<ReportType[]> {
        const { data, error } = await supabase
            .from('report_types')
            .select('*')
            .order('id');

        if (error) throw error;
        return data as ReportType[];
    },

    async saveExaminer(profile: Partial<Profile>): Promise<Profile> {
        // Updating a profile usually requires updating the 'profiles' table.
        // Creating a new one requires creating an auth user, which should be done via Auth API or Edge Function.
        // Here we will only support Updating existing profiles.

        if (!profile.id) {
            throw new Error("Creating new examiners directly is not supported. Invite a user instead.");
        }

        const updates = {
            name: profile.name,
            last_name: profile.last_name,
            title: profile.title,
            accreditations: profile.accreditations,
            role: profile.role
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            lastName: data.last_name,
            isAdmin: data.role === 'admin'
        } as Profile;
    },

    async deleteExaminer(id: string): Promise<void> {
        // Deleting a profile does not delete the Auth User.
        // This usually requires admin privileges or Edge Function to delete from auth.users.
        // For now, we just delete the profile row (which cascades from auth.users usually, but here we do reverse?)
        // Actually, deleting from 'profiles' won't delete 'auth.users'.
        // We'll just delete the profile data for now.

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
