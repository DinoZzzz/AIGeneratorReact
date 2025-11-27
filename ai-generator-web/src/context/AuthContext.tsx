import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
type User = NonNullable<Session>['user'];

interface AuthContextType {
    session: Session;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    lowBandwidthMode: boolean;
    setLowBandwidthMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
    lowBandwidthMode: false,
    setLowBandwidthMode: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
        return localStorage.getItem('lowBandwidthMode') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('lowBandwidthMode', String(lowBandwidthMode));
        if (lowBandwidthMode) {
            document.body.classList.add('low-bandwidth');
        } else {
            document.body.classList.remove('low-bandwidth');
        }
    }, [lowBandwidthMode]);

    const loadProfile = async (userId: string) => {
        // Skip profile loading in low bandwidth mode to save data
        if (lowBandwidthMode) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data) {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user && !lowBandwidthMode) {
                loadProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user && !lowBandwidthMode) {
                loadProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [lowBandwidthMode]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile: async () => {
            if (user && !lowBandwidthMode) {
                await loadProfile(user.id);
            }
        },
        lowBandwidthMode,
        setLowBandwidthMode
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
