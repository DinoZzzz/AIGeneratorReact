import { supabase } from '../../lib/supabase';

export const loadFile = async (path: string): Promise<ArrayBuffer> => {
    const { data } = supabase.storage
        .from('templates')
        .getPublicUrl(path);

    if (!data.publicUrl) {
        throw new Error('Failed to get public URL for template');
    }

    const response = await fetch(`${data.publicUrl}?t=${new Date().getTime()}`);

    if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
    }

    return await response.arrayBuffer();
};
