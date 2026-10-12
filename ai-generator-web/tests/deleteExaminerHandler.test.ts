import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeleteExaminerHandler } from '../supabase/functions/admin-delete-examiner/handler';

const callerId = '00000000-0000-0000-0000-000000000001';
const targetId = '00000000-0000-0000-0000-000000000002';
const dependencies = {
  getCaller: vi.fn(), getCallerRole: vi.fn(), hasReferences: vi.fn(), deleteAuthUser: vi.fn(),
};
const handler = createDeleteExaminerHandler(dependencies);
const request = (userId = targetId, headers: HeadersInit = { Authorization: 'Bearer valid-token' }) =>
  new Request('https://example.test', { method: 'POST', headers, body: JSON.stringify({ userId }) });

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.getCaller.mockResolvedValue({ id: callerId });
  dependencies.getCallerRole.mockResolvedValue('admin');
  dependencies.hasReferences.mockResolvedValue(false);
  dependencies.deleteAuthUser.mockResolvedValue(undefined);
});

describe('admin examiner deletion endpoint', () => {
  it('verifies the caller and deletes the Auth account only for an administrator', async () => {
    const response = await handler(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(dependencies.getCaller).toHaveBeenCalledWith('valid-token');
    expect(dependencies.getCallerRole).toHaveBeenCalledWith(callerId);
    expect(dependencies.deleteAuthUser).toHaveBeenCalledWith(targetId);
  });
  it.each(['missing-token', 'invalid-token', 'ordinary-user'])('rejects %s before deletion', async (kind) => {
    if (kind === 'invalid-token') dependencies.getCaller.mockResolvedValue(null);
    if (kind === 'ordinary-user') dependencies.getCallerRole.mockResolvedValue('user');
    const response = await handler(request(targetId, kind === 'missing-token' ? {} : { Authorization: 'Bearer token' }));
    expect([401, 403]).toContain(response.status);
    expect(dependencies.deleteAuthUser).not.toHaveBeenCalled();
  });
  it('rejects self-deletion', async () => {
    const response = await handler(request(callerId));
    expect(await response.json()).toEqual({ code: 'examiner_delete_self' });
    expect(dependencies.deleteAuthUser).not.toHaveBeenCalled();
  });
  it('rejects self-deletion with an uppercase UUID spelling', async () => {
    const mixedCaseId = 'abcdef01-abcd-4abc-8abc-abcdef012345';
    dependencies.getCaller.mockResolvedValue({ id: mixedCaseId });
    const response = await handler(request(mixedCaseId.toUpperCase()));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'examiner_delete_self' });
    expect(dependencies.hasReferences).not.toHaveBeenCalled();
    expect(dependencies.deleteAuthUser).not.toHaveBeenCalled();
  });
  it('preserves accounts linked to historical reports or appointments', async () => {
    dependencies.hasReferences.mockResolvedValue(true);
    const response = await handler(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'examiner_in_use' });
    expect(dependencies.deleteAuthUser).not.toHaveBeenCalled();
  });
  it('does not report success when Auth rejects the deletion', async () => {
    dependencies.deleteAuthUser.mockRejectedValue(new Error('Database error deleting user'));
    const response = await handler(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: 'examiner_delete_failed' });
  });
  it('rejects malformed ids before checking or deleting target data', async () => {
    const response = await handler(request('not-a-uuid'));
    expect(response.status).toBe(400);
    expect(dependencies.hasReferences).not.toHaveBeenCalled();
    expect(dependencies.deleteAuthUser).not.toHaveBeenCalled();
  });
});
