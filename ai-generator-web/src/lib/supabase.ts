import { createClient } from '@supabase/supabase-js';
import { sessionGuardedFetch } from './offlineSessionLifecycle';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const authorization = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).get('authorization');
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
      const revokingDevice = method === 'DELETE' && new URL(url).pathname === '/rest/v1/user_sessions';
      // Auth must finish sign-out; public username lookup must still work on
      // the login screen. Only authenticated data responses populate caches.
      // Device revocation is part of confirmed sign-out and never caches rows.
      if (url.includes('/auth/v1/') || revokingDevice || authorization === `Bearer ${supabaseAnonKey}`) return fetch(input, init);
      return sessionGuardedFetch(input, init);
    },
  },
});
