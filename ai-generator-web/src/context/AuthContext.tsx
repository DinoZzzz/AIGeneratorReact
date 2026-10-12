import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { setUserContext, clearUserContext } from '../lib/sentry';
import { getSyncQueueSummary, saveMetadata } from '../lib/offlineDb';
import { clearOfflineSessionData } from '../lib/offlineSessionData';
import { queryClient } from '../lib/queryClient';
import { prewarmLookupCache } from '../lib/offlineLookupCache';
import { pullRemoteChanges } from '../lib/syncService';
import { syncPushSubscriptionIfEnabled } from '../lib/notificationService';
import { registerSession, updateLastActive, revokeCurrentSession } from '../services/sessionService';
import { signOutWithOfflineProtection } from '../lib/offlineSignOutGuard';
import { assertOfflineSessionCurrent, getOfflineSessionGeneration, isOfflineSessionCurrent, resumeOfflineSession, withOfflineSyncLock } from '../lib/offlineSessionLifecycle';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
type User = NonNullable<Session>['user'];
const SYNC_SESSION_METADATA_KEY = 'supabase_session_tokens';

interface AuthContextType {
    session: Session;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: (confirmDiscard?: (count: number) => Promise<boolean>) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
    lowBandwidthMode: boolean;
    setLowBandwidthMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => false,
    refreshProfile: async () => { },
    lowBandwidthMode: false,
    setLowBandwidthMode: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const persistSyncSession = async (sessionValue: Session) => {
    if (!isOfflineSessionCurrent(getOfflineSessionGeneration())) return;
    if (!sessionValue?.access_token || !sessionValue.refresh_token) {
        await saveMetadata(SYNC_SESSION_METADATA_KEY, null);
        return;
    }

    await saveMetadata(SYNC_SESSION_METADATA_KEY, {
        access_token: sessionValue.access_token,
        refresh_token: sessionValue.refresh_token,
        user_id: sessionValue.user.id,
        expires_at: sessionValue.expires_at
    });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
        return localStorage.getItem('lowBandwidthMode') === 'true';
    });
    const warmedLookupUserRef = useRef<string | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const signingOutRef = useRef(false);

    useEffect(() => {
        localStorage.setItem('lowBandwidthMode', String(lowBandwidthMode));
        if (lowBandwidthMode) {
            document.body.classList.add('low-bandwidth');
        } else {
            document.body.classList.remove('low-bandwidth');
        }
    }, [lowBandwidthMode]);

    const loadProfile = useCallback(async (userId: string) => {
        try {
            // Roles and accreditations are required even in low bandwidth mode.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, last_name, username, email, avatar_url, role, accreditations')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data && currentUserIdRef.current === userId) {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }, []);

    useEffect(() => {
        let active = true;
        let sessionEventReceived = false;

        const applySession = (_event: string, session: Session) => {
            if (!active) return;
            sessionEventReceived = true;
            const nextUserId = session?.user.id ?? null;
            if (nextUserId && !isOfflineSessionCurrent(getOfflineSessionGeneration())) {
                if (signingOutRef.current) return;
                // A refresh/initial event in another tab must not lift an
                // in-progress sign-out barrier. Recheck after its lock ends.
                queueMicrotask(() => {
                    void withOfflineSyncLock(async () => {
                        const { data: { session: latest } } = await supabase.auth.getSession();
                        if (!active || !latest || latest.user.id !== nextUserId) return;
                        resumeOfflineSession();
                        applySession(_event, latest);
                    }).catch((error) => console.error('Could not resume account data:', error));
                });
                return;
            }
            if (currentUserIdRef.current !== nextUserId) {
                if (currentUserIdRef.current !== null) queryClient.clear();
                setProfile(null);
            }
            currentUserIdRef.current = nextUserId;
            setSession(session);
            setUser(session?.user ?? null);
            void persistSyncSession(session).catch((error) => console.error('Could not persist sync session:', error));
            if (session?.user) {
                void loadProfile(session.user.id);
                // Set Sentry user context for error tracking
                setUserContext({
                    id: session.user.id,
                    email: session.user.email,
                });
                // Track device session
                if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
                    void registerSession(session.user.id);
                } else if (_event === 'TOKEN_REFRESHED') {
                    void updateLastActive(session.user.id);
                }
            } else {
                setProfile(null);
                // Clear Sentry user context on logout
                clearUserContext();
            }
            setLoading(false);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!active || sessionEventReceived) return;
            applySession('INITIAL_SESSION', session);
        }).catch((error) => {
            if (!active || sessionEventReceived) return;
            console.error('Error loading session:', error);
            setLoading(false);
        });

        // Keep the auth callback synchronous: Supabase invokes it under its
        // own auth lock, so any deferred lock work must not be awaited here.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(applySession);

        return () => {
            active = false;
            currentUserIdRef.current = null;
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    useEffect(() => {
        const warmLookups = async () => {
            const generation = getOfflineSessionGeneration();
            if (!user || lowBandwidthMode || !navigator.onLine) {
                return;
            }
            if (warmedLookupUserRef.current === user.id) {
                return;
            }
            warmedLookupUserRef.current = user.id;
            await prewarmLookupCache();
            assertOfflineSessionCurrent(generation);
            // Replicate server data into IndexedDB right after login so the
            // app works offline even for pages the user hasn't visited yet.
            await pullRemoteChanges();
        };

        void warmLookups().catch(() => {});
    }, [lowBandwidthMode, user]);

    // Ask the browser to protect IndexedDB + caches from storage-pressure
    // eviction (Safari in particular evicts unused PWA data after ~7 days).
    const storagePersistRequestedRef = useRef(false);
    useEffect(() => {
        if (!user || storagePersistRequestedRef.current) return;
        storagePersistRequestedRef.current = true;
        navigator.storage?.persist?.().then((granted) => {
            if (!granted) {
                console.info('Persistent storage was not granted; offline data may be evicted under storage pressure.');
            }
        }).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!user?.id) return;
        void syncPushSubscriptionIfEnabled(user.id);
    }, [user?.id]);

    // Proactively refresh session when tab becomes visible to prevent JWT expiry
    // after the browser has suspended background timers (e.g. laptop lid closed)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || !session?.expires_at) return;
            // Refresh if the token expires within the next 5 minutes
            const expiresInMs = session.expires_at * 1000 - Date.now();
            if (expiresInMs < 5 * 60 * 1000) {
                void supabase.auth.refreshSession();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [session?.expires_at]);

    useEffect(() => {
        const handleOnline = () => {
            if (user && !lowBandwidthMode) {
                warmedLookupUserRef.current = null;
                void prewarmLookupCache().catch(() => {});
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [lowBandwidthMode, user]);

    const signOut = useCallback(async (confirmDiscard?: (count: number) => Promise<boolean>) => {
        if (signingOutRef.current) return false;
        signingOutRef.current = true;
        try {
            const signedOut = await signOutWithOfflineProtection({
                readPendingCount: async () => {
                    const summary = await getSyncQueueSummary();
                    return summary.pending + summary.failed + summary.inProgress + summary.discarded;
                },
                confirmDiscard,
                cancelQueries: () => queryClient.cancelQueries(),
                signOut: async () => {
                    // The user has confirmed queue disposal at this point.
                    if (user?.id) await revokeCurrentSession(user.id).catch(() => {});
                    return supabase.auth.signOut();
                },
                clearData: clearOfflineSessionData,
            });
            if (!signedOut) return false;
            queryClient.clear();
            warmedLookupUserRef.current = null;
            setProfile(null);
            setSession(null);
            setUser(null);
            currentUserIdRef.current = null;
            // Clear Sentry user context
            clearUserContext();
            return true;
        } finally {
            signingOutRef.current = false;
        }
    }, [user?.id]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await loadProfile(user.id);
        }
    }, [user, loadProfile]);

    const value = useMemo(() => ({
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
        lowBandwidthMode,
        setLowBandwidthMode
    }), [session, user, profile, loading, signOut, refreshProfile, lowBandwidthMode]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
