import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createDeleteExaminerHandler } from './handler.ts';

const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Existing NO ACTION foreign keys deliberately preserve historical authorship.
// The FK constraints also protect against a reference created after this check.
const references = [
  ['report_forms', 'user_id'],
  ['report_exports', 'user_id'],
  ['report_exports', 'certifier_id'],
  ['calendar_events', 'created_by'],
  ['appointments', 'created_by'],
  ['appointments', 'examiner_id'],
  ['scheme_images', 'updated_by'],
  ['template_metadata', 'uploaded_by'],
];

serve(createDeleteExaminerHandler({
  getCaller: async (token) => {
    const { data, error } = await client.auth.getUser(token);
    return error ? null : data.user;
  },
  getCallerRole: async (userId) => {
    const { data, error } = await client.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data?.role ?? null;
  },
  hasReferences: async (userId) => {
    for (const [table, column] of references) {
      const { data, error } = await client.from(table).select('id').eq(column, userId).limit(1);
      if (error) throw error;
      if (data?.length) return true;
    }
    return false;
  },
  deleteAuthUser: async (userId) => {
    const { error } = await client.auth.admin.deleteUser(userId);
    // Retrying after a lost success response must not fail on an already deleted account.
    if (error && error.code !== 'user_not_found') throw error;
  },
}));
