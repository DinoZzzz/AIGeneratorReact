import type { WorkboxPlugin } from 'workbox-core';
import { getMetadata } from './offlineDb';
import { getOfflineSessionGeneration, isOfflineSessionCurrent } from './offlineSessionLifecycle';

const currentSession = () => getMetadata<{ access_token?: string; user_id?: string }>('supabase_session_tokens');
const OWNER_HEADER = 'x-ai-cache-owner';

/** Sign-out waits for existing runtime-cache handlers before deleting caches. */
export const offlineRuntimeCachePlugin: WorkboxPlugin = {
  handlerWillStart: async ({ state, request }) => {
    if (!state) return;
    state.generation = getOfflineSessionGeneration();
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      await new Promise<void>((resolve, reject) => {
        void navigator.locks.request('ai-generator-private-cache', { mode: 'shared' }, async () => {
          await new Promise<void>((release) => {
            state.releaseCacheLock = release;
            resolve();
          });
        }).catch(reject);
      });
    }
    try {
      const session = await currentSession();
      // An old-token request may arrive after another account signed in.
      // Unauthenticated image requests cannot establish a private owner.
      if (session?.access_token && request.headers.get('authorization') === `Bearer ${session.access_token}`) {
        state.sessionToken = session.access_token;
        state.sessionUserId = session.user_id;
      }
    } catch (error) {
      (state.releaseCacheLock as (() => void) | undefined)?.();
      throw error;
    }
  },
  cacheWillUpdate: async ({ response, state }) => {
    if (!state || !isOfflineSessionCurrent(state.generation as number)) return null;
    const session = await currentSession();
    if (!state.sessionUserId || state.sessionUserId !== session?.user_id || state.sessionToken !== session?.access_token) return null;
    const headers = new Headers(response.headers);
    headers.set(OWNER_HEADER, String(state.sessionUserId));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
  cachedResponseWillBeUsed: async ({ cachedResponse, state }) => {
    if (!state || !isOfflineSessionCurrent(state.generation as number)) return null;
    const session = await currentSession();
    return state.sessionUserId && state.sessionUserId === session?.user_id
      && state.sessionToken === session?.access_token
      && cachedResponse?.headers.get(OWNER_HEADER) === state.sessionUserId ? cachedResponse : null;
  },
  handlerDidComplete: async ({ state }) => {
    (state?.releaseCacheLock as (() => void) | undefined)?.();
  },
};
