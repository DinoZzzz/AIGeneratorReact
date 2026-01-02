import { supabase } from '../lib/supabase';
import { AppError } from '../lib/errorHandler';

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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        // Reverse to show oldest first
        return (data || []).reverse() as Message[];
    },

    async sendMessage(content: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ content, user_id: (await supabase.auth.getUser()).data.user?.id }])
            .select(`
                *,
                user:profiles(name, last_name, email, avatar_url)
            `)
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Message;
    },

    async deleteMessage(id: string) {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
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
