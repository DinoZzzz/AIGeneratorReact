import { supabase } from '../lib/supabase';

const DEVICE_ID_KEY = 'device_id';

export interface UserSession {
    id: string;
    user_id: string;
    device_id: string;
    device_name: string;
    browser: string | null;
    os: string | null;
    last_active_at: string;
    created_at: string;
}

export function getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

function parseUserAgent(): { browser: string; os: string; deviceName: string } {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Browser detection
    if (ua.includes('Firefox/')) {
        browser = 'Firefox';
    } else if (ua.includes('Edg/')) {
        browser = 'Edge';
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
        browser = 'Chrome';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        browser = 'Safari';
    } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
        browser = 'Opera';
    }

    // OS detection
    if (ua.includes('Windows')) {
        os = 'Windows';
    } else if (ua.includes('Mac OS X')) {
        os = 'macOS';
    } else if (ua.includes('Android')) {
        os = 'Android';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
        os = 'iOS';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    }

    return { browser, os, deviceName: `${browser} on ${os}` };
}

export async function registerSession(userId: string): Promise<void> {
    const deviceId = getOrCreateDeviceId();
    const { browser, os, deviceName } = parseUserAgent();

    await supabase
        .from('user_sessions')
        .upsert(
            {
                user_id: userId,
                device_id: deviceId,
                device_name: deviceName,
                browser,
                os,
                last_active_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,device_id' }
        );
}

export async function updateLastActive(userId: string): Promise<void> {
    const deviceId = getOrCreateDeviceId();

    await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
}

export async function listSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
        .from('user_sessions')
        .select('id, user_id, device_id, device_name, browser, os, last_active_at, created_at')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

    if (error) throw error;
    return data as UserSession[];
}

export async function revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) throw error;
}

export async function revokeCurrentSession(userId: string): Promise<void> {
    const deviceId = getOrCreateDeviceId();

    await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('device_id', deviceId);
}
