import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { Profile, ReportType } from '../types';
import { createWeakPasswordError, isWeakPasswordAuthError, validatePasswordStrength } from '../lib/passwordValidation';
import { getLookupWithOfflineFallback } from '../lib/offlineLookupCache';

interface ProfileFromDB {
    id: string;
    name: string;
    last_name: string;
    username?: string;
    email: string;
    title?: string;
    gender?: string;
    avatar_url?: string;
    role: string;
    accreditations?: string;
}

export const examinerService = {
    async getExaminers(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, last_name, username, email, title, gender, avatar_url, role, accreditations')
            .order('name');

        if (error) {
            captureError(error, { service: 'examinerService', method: 'getExaminers' });
            throw error;
        }

        // Map snake_case DB fields to camelCase TS interface if necessary,
        // or ensure Types/DB match.
        // In types/index.ts we defined Profile with snake_case 'last_name' but camelCase 'lastName' in previous version.
        // I updated types/index.ts to have 'last_name' and optional 'lastName' map if needed.
        // Ideally we just use the DB shape.

        return (data as ProfileFromDB[]).map((p) => ({
            ...p,
            lastName: p.last_name, // Compatibility mapping
            isAdmin: p.role === 'admin'
        })) as Profile[];
    },

    async getReportTypes(): Promise<ReportType[]> {
        try {
            return await getLookupWithOfflineFallback<ReportType>('report_types', 'id');
        } catch (error) {
            captureError(error instanceof Error ? error : new Error('Failed to load report types'), {
                service: 'examinerService',
                method: 'getReportTypes'
            });
            throw error;
        }
    },

    async saveExaminer(profile: Partial<Profile> & { password?: string }): Promise<Profile> {
        // If no ID, we're creating a new profile
        if (!profile.id) {
            // First, create the auth user
            if (!profile.email || !profile.password) {
                const error = new Error('Email and password are required for new examiners');
                captureError(error, { service: 'examinerService', method: 'saveExaminer', email: profile.email });
                throw error;
            }

            const passwordValidation = validatePasswordStrength(profile.password);
            if (passwordValidation === 'too_short') {
                throw createWeakPasswordError('Password must be at least 8 characters long');
            }
            if (passwordValidation === 'weak') {
                throw createWeakPasswordError('Password is known to be weak and easy to guess, please choose a different one.');
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

            if (authError) {
                if (isWeakPasswordAuthError(authError)) {
                    throw authError;
                }
                captureError(authError, { service: 'examinerService', method: 'saveExaminer', step: 'signUp' });
                throw authError;
            }
            if (!authData.user) {
                const error = new Error('Failed to create user');
                captureError(error, { service: 'examinerService', method: 'saveExaminer' });
                throw error;
            }

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
                email: profile.email,
                gender: profile.gender,
                avatar_url: profile.avatar_url
            };

            const { data, error } = await supabase
                .from('profiles')
                .upsert(newProfile)
                .select()
                .single();

            if (error) {
                captureError(error, { service: 'examinerService', method: 'saveExaminer', step: 'upsert' });
                throw error;
            }
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
            role: profile.role,
            gender: profile.gender,
            avatar_url: profile.avatar_url
        };

        // If password is provided, update it using Edge Function
        if (profile.password && profile.password.trim() !== '') {
            const passwordValidation = validatePasswordStrength(profile.password);
            if (passwordValidation === 'too_short') {
                throw createWeakPasswordError('Password must be at least 8 characters long');
            }
            if (passwordValidation === 'weak') {
                throw createWeakPasswordError('Password is known to be weak and easy to guess, please choose a different one.');
            }

            // Use Edge Function to reset password (works for any user)
            const { data, error: passwordError } = await supabase.functions.invoke('admin-reset-password', {
                body: {
                    userId: profile.id,
                    password: profile.password
                }
            });

            if (passwordError) {
                if (isWeakPasswordAuthError(passwordError)) {
                    throw passwordError;
                }
                const error = new Error(
                    passwordError.message ||
                    'Unable to update password. Make sure the Edge Function is deployed.'
                );
                captureError(error, { service: 'examinerService', method: 'saveExaminer', step: 'passwordReset', userId: profile.id });
                throw error;
            }

            if (!data?.success) {
                const possibleWeakPasswordMessage = typeof data?.error === 'string'
                    ? data.error
                    : typeof data?.message === 'string'
                        ? data.message
                        : '';

                if (possibleWeakPasswordMessage && isWeakPasswordAuthError({ code: 'weak_password', message: possibleWeakPasswordMessage })) {
                    throw createWeakPasswordError(possibleWeakPasswordMessage);
                }

                const error = new Error(
                    possibleWeakPasswordMessage ||
                    'Unable to update password. Make sure the Edge Function is deployed.'
                );
                captureError(error, { service: 'examinerService', method: 'saveExaminer', step: 'passwordReset', userId: profile.id });
                throw error;
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'examinerService', method: 'saveExaminer', step: 'update', profileId: profile.id });
            throw error;
        }
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

        if (error) {
            captureError(error, { service: 'examinerService', method: 'deleteExaminer', id });
            throw error;
        }
    },

    async uploadAvatar(file: File, userId: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            captureError(uploadError, { service: 'examinerService', method: 'uploadAvatar', userId });
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
