import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { setUserContext, clearUserContext } from '../lib/sentry';
import { clearStore, saveMetadata, STORES } from '../lib/offlineDb';
import { prewarmLookupCache } from '../lib/offlineLookupCache';
import { syncPushSubscriptionIfEnabled } from '../lib/notificationService';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
type User = NonNullable<Session>['user'];
const SYNC_SESSION_METADATA_KEY = 'supabase_session_tokens';

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
    const warmedLookupUserRef = useRef<string | null>(null);

    const clearOfflineSessionData = async () => {
        await Promise.all([
            clearStore(STORES.CUSTOMERS),
            clearStore(STORES.CONSTRUCTIONS),
            clearStore(STORES.REPORTS),
            clearStore(STORES.APPOINTMENTS),
            clearStore(STORES.MESSAGES),
            clearStore(STORES.EXAMINERS),
            clearStore(STORES.REPORT_TYPES),
            clearStore(STORES.MATERIALS),
            clearStore(STORES.SCHEME_IMAGES),
            clearStore(STORES.CERTIFIERS),
            clearStore(STORES.EXPORT_HISTORY),
            clearStore(STORES.EXPORT_HISTORY_FORMS),
            clearStore(STORES.REPORT_FILES),
            clearStore(STORES.TEMPLATE_CACHE),
            clearStore(STORES.UPLOADS),
            clearStore(STORES.SYNC_QUEUE),
            clearStore(STORES.METADATA),
        ]);
    };

    const persistSyncSession = async (sessionValue: Session) => {
        if (!sessionValue?.access_token || !sessionValue.refresh_token) {
            await saveMetadata(SYNC_SESSION_METADATA_KEY, null);
            return;
        }

        await saveMetadata(SYNC_SESSION_METADATA_KEY, {
            access_token: sessionValue.access_token,
            refresh_token: sessionValue.refresh_token,
            expires_at: sessionValue.expires_at
        });
    };

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
            // Only fetch fields needed for UI display and role checking
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, last_name, username, email, avatar_url, role, accreditations')
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
            void persistSyncSession(session);
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
            void persistSyncSession(session);
            if (session?.user && !lowBandwidthMode) {
                loadProfile(session.user.id);
                // Set Sentry user context for error tracking
                setUserContext({
                    id: session.user.id,
                    email: session.user.email,
                });
            } else {
                setProfile(null);
                // Clear Sentry user context on logout
                clearUserContext();
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    // loadProfile is stable and only needs to run when lowBandwidthMode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lowBandwidthMode]);

    useEffect(() => {
        const warmLookups = async () => {
            if (!user || lowBandwidthMode || !navigator.onLine) {
                return;
            }
            if (warmedLookupUserRef.current === user.id) {
                return;
            }
            warmedLookupUserRef.current = user.id;
            await prewarmLookupCache();
        };

        void warmLookups();
    }, [lowBandwidthMode, user]);

    useEffect(() => {
        if (!user?.id) return;
        void syncPushSubscriptionIfEnabled(user.id);
    }, [user?.id]);

    useEffect(() => {
        const handleOnline = () => {
            if (user && !lowBandwidthMode) {
                warmedLookupUserRef.current = null;
                void prewarmLookupCache();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [lowBandwidthMode, user]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            warmedLookupUserRef.current = null;
            setProfile(null);
            // Clear Sentry user context
            clearUserContext();
            try {
                await clearOfflineSessionData();
            } catch (error) {
                console.error('Failed to clear offline cache during sign out:', error);
            }
        }
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
