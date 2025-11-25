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

    async saveExaminer(profile: Partial<Profile> & { password?: string }): Promise<Profile> {
        // If no ID, we're creating a new profile
        if (!profile.id) {
            // First, create the auth user
            if (!profile.email || !profile.password) {
                throw new Error('Email and password are required for new examiners');
            }

            // Save the current session to restore it after creating the new user
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: profile.email,
                password: profile.password,
                options: {
                    data: {
                        name: profile.name,
                        last_name: profile.last_name,
                        username: profile.username
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user');

            // Restore the original session to prevent auto-login as the new user
            if (currentSession) {
                await supabase.auth.setSession({
                    access_token: currentSession.access_token,
                    refresh_token: currentSession.refresh_token
                });
            }

            // Now create/update the profile with the auth user's ID
            // Use upsert to handle the case where a trigger might have already created the profile
            const newProfile = {
                id: authData.user.id,
                name: profile.name,
                last_name: profile.last_name,
                username: profile.username,
                title: profile.title,
                accreditations: profile.accreditations || [],
                role: profile.role || 'user',
                email: profile.email
            };

            const { data, error } = await supabase
                .from('profiles')
                .upsert(newProfile)
                .select()
                .single();

            if (error) throw error;
            return {
                ...data,
                lastName: data.last_name,
                isAdmin: data.role === 'admin'
            } as Profile;
        }

        // Updating existing profile
        const updates = {
            name: profile.name,
            last_name: profile.last_name,
            username: profile.username,
            title: profile.title,
            accreditations: profile.accreditations,
            role: profile.role
        };

        // If password is provided, update it
        if (profile.password && profile.password.trim() !== '') {
            // Save the current session to restore it after password update
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            // Update the user's password using the auth admin API
            const { error: passwordError } = await supabase.auth.updateUser({
                password: profile.password
            });

            if (passwordError) {
                // If direct update fails (likely because we're not that user), 
                // we need to use a different approach or Edge Function
                console.error('Password update error:', passwordError);
                throw new Error('Unable to update password. Admin features may require Edge Function setup.');
            }

            // Restore the original session if we changed it
            if (currentSession) {
                await supabase.auth.setSession({
                    access_token: currentSession.access_token,
                    refresh_token: currentSession.refresh_token
                });
            }
        }

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
