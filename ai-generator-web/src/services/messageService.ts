import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import { AppError, AuthError, isNetworkError, NetworkError } from '../lib/errorHandler';

const throwMessageError = (error: { message: string }, method: string, id?: string): never => {
    captureError(error, { service: 'messageService', method, id });
    // Preserve fetch failures so the chat can safely queue the operation offline.
    if (isNetworkError(error)) throw error;
    throw new AppError(error.message, 'SUPABASE_ERROR', 500);
};

export interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    user?: {
        name?: string;
        last_name?: string;
        email?: string;
        avatar_url?: string;
    };
}

export const messageService = {
    async getMessages(limit: number = 200) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                user:profiles(name, last_name, email, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throwMessageError(error, 'getMessages');
        }

        // Reverse to show oldest first
        return (data || []).reverse() as Message[];
    },

    async sendMessage(content: string) {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) {
            if (authError.name === 'AuthRetryableFetchError') throw new NetworkError(authError.message);
            throw authError;
        }
        if (!auth.user) throw new AuthError();
        const { data, error } = await supabase
            .from('messages')
            .insert([{ content, user_id: auth.user.id }])
            .select(`
                *,
                user:profiles(name, last_name, email, avatar_url)
            `)
            .single();

        if (error) {
            throwMessageError(error, 'sendMessage');
        }
        return data as Message;
    },

    async updateMessage(id: string, content: string) {
        const { data, error } = await supabase
            .from('messages')
            .update({ content, is_edited: true, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
                *,
                user:profiles(name, last_name, email, avatar_url)
            `)
            .single();

        if (error) {
            throwMessageError(error, 'updateMessage', id);
        }
        return data as Message;
    },

    async deleteMessage(id: string) {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            throwMessageError(error, 'deleteMessage', id);
        }
    },

    subscribeToMessages(callback: (message: Message) => void) {
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    // Fetch the full message with user data
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            user:profiles(name, last_name, email, avatar_url)
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) callback(data as Message);
                }
            )
            .subscribe();

        return channel;
    }
};
