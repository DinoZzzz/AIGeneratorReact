import { supabase } from '../lib/supabase';

const errorKeys: Record<string, string> = {
  examiner_in_use: 'examiners.deleteInUse',
  examiner_delete_self: 'examiners.deleteSelf',
  examiner_delete_forbidden: 'examiners.deleteForbidden',
  examiner_delete_unavailable: 'examiners.deleteUnavailable',
  examiner_delete_failed: 'examiners.deleteFailed',
};

export const getExaminerDeleteErrorKey = (error: unknown): string | undefined => {
  const code = typeof error === 'string' ? error
    : error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return errorKeys[code];
};

export async function deleteExaminerAccount(userId: string): Promise<void> {
  const result = await supabase.functions.invoke('admin-delete-examiner', { body: { userId } }).catch(() => null);
  if (!result) {
    throw Object.assign(new Error('examiner_delete_unavailable'), { code: 'examiner_delete_unavailable' });
  }
  const { data, error } = result;
  if (!error && data?.success === true) return;

  let payload = data;
  if (!payload && error?.context instanceof Response) {
    payload = await error.context.clone().json().catch(() => null);
  }
  const code = typeof payload?.code === 'string' && errorKeys[payload.code]
    ? payload.code
    : 'examiner_delete_unavailable';
  throw Object.assign(new Error(code), { code });
}
