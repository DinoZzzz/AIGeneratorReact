export interface DeleteExaminerDependencies {
  getCaller: (token: string) => Promise<{ id: string } | null>;
  getCallerRole: (userId: string) => Promise<string | null>;
  hasReferences: (userId: string) => Promise<boolean>;
  deleteAuthUser: (userId: string) => Promise<void>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: object) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const createDeleteExaminerHandler = (dependencies: DeleteExaminerDependencies) => async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { code: 'method_not_allowed' });
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return reply(401, { code: 'examiner_delete_forbidden' });

  try {
    const caller = await dependencies.getCaller(token);
    if (!caller) return reply(401, { code: 'examiner_delete_forbidden' });
    if (await dependencies.getCallerRole(caller.id) !== 'admin') {
      return reply(403, { code: 'examiner_delete_forbidden' });
    }
    const body = await req.json().catch(() => null);
    if (typeof body?.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)) {
      return reply(400, { code: 'examiner_delete_failed' });
    }
    const targetId = body.userId.toLowerCase();
    if (targetId === caller.id.toLowerCase()) return reply(409, { code: 'examiner_delete_self' });
    if (await dependencies.hasReferences(targetId)) {
      return reply(409, { code: 'examiner_in_use' });
    }
    // Delete the Auth account, letting its existing FK cascade remove profiles.
    // Never delete profile/history rows first: a blocked Auth delete stays atomic.
    await dependencies.deleteAuthUser(targetId);
    return reply(200, { success: true });
  } catch {
    return reply(500, { code: 'examiner_delete_failed' });
  }
};
