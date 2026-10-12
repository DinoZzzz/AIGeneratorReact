import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signUp: vi.fn(),
  mainSignUp: vi.fn(),
  mainSetSession: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
  invoke: vi.fn(),
  captureError: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: { signUp: mocks.mainSignUp, setSession: mocks.mainSetSession },
    from: () => ({
      upsert: mocks.upsert,
      update: mocks.update,
    }),
    functions: { invoke: mocks.invoke },
  },
}));
vi.mock('../src/lib/sentry', () => ({ captureError: mocks.captureError }));
vi.mock('../src/lib/offlineLookupCache', () => ({ getLookupWithOfflineFallback: vi.fn() }));

import { examinerService } from '../src/services/examinerService';

const profile = {
  id: 'new-examiner', name: 'Ana', last_name: 'Test', username: 'ana',
  email: 'ana@example.com', role: 'user', accreditations: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
  mocks.createClient.mockReturnValue({ auth: { signUp: mocks.signUp } });
  mocks.signUp.mockResolvedValue({ data: { user: { id: profile.id } }, error: null });
  mocks.single.mockResolvedValue({ data: profile, error: null });
  mocks.upsert.mockReturnValue({ select: () => ({ single: mocks.single }) });
  mocks.update.mockReturnValue({ eq: () => ({ select: () => ({ single: mocks.single }) }) });
});

describe('examiner account creation', () => {
  it('uses a non-persistent isolated session and saves the profile through the administrator client', async () => {
    await expect(examinerService.saveExaminer({
      name: profile.name, last_name: profile.last_name, username: profile.username,
      email: profile.email, password: 'Strong!956', role: 'user',
    })).resolves.toMatchObject({ id: profile.id });

    expect(mocks.createClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      auth: {
        persistSession: false, autoRefreshToken: false,
        detectSessionInUrl: false, storageKey: 'examiner-signup',
      },
    });
    expect(mocks.signUp).toHaveBeenCalledOnce();
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: profile.id, role: 'user' }));
    expect(mocks.mainSignUp).not.toHaveBeenCalled();
    expect(mocks.mainSetSession).not.toHaveBeenCalled();
  });

  it('does not modify the administrator session if creating the examiner fails', async () => {
    mocks.signUp.mockResolvedValueOnce({ data: { user: null }, error: { message: 'User already registered' } });
    await expect(examinerService.saveExaminer({
      email: profile.email, password: 'Strong!956',
    })).rejects.toMatchObject({ code: 'user_already_registered' });
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.mainSignUp).not.toHaveBeenCalled();
    expect(mocks.mainSetSession).not.toHaveBeenCalled();
  });
});

describe('examiner password reset errors', () => {
  it('retains a function authorization failure instead of labelling it a weak password', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: new Response(JSON.stringify({ error: 'Only admins can reset passwords' }), { status: 403 }),
      },
    });

    const result = examinerService.saveExaminer({ id: profile.id, password: 'Strong!956' });
    await expect(result).rejects.toThrow('Only admins can reset passwords');
    await expect(result).rejects.not.toHaveProperty('code', 'weak_password');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('preserves a real weak-password code returned by the function', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: new Response(JSON.stringify({ error: 'Password rejected', code: 'weak_password' }), { status: 400 }),
      },
    });
    await expect(examinerService.saveExaminer({ id: profile.id, password: 'Strong!956' }))
      .rejects.toMatchObject({ code: 'weak_password', message: 'Password rejected' });
  });

  it('preserves errors returned in unsuccessful function data', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { success: false, error: 'User not found' }, error: null });
    const result = examinerService.saveExaminer({ id: profile.id, password: 'Strong!956' });
    await expect(result).rejects.toThrow('User not found');
    await expect(result).rejects.not.toHaveProperty('code', 'weak_password');
  });
});
