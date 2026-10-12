import { describe, expect, it } from 'vitest';
import { validatePasswordResetInput } from '../supabase/functions/admin-reset-password/validation';

describe('admin password reset input', () => {
  it.each([null, [], {}, { userId: 7, password: 'Strong!956' }, { userId: 'user', password: 12345678 }])(
    'rejects malformed input %j before calling the admin API', (input) => {
      expect(validatePasswordResetInput(input)).toHaveProperty('error');
    },
  );

  it.each(['Ab1!xy', 'Ab1!xyz', '  A!34  '])('requires at least eight non-padding characters: %j', (password) => {
    expect(validatePasswordResetInput({ userId: 'user', password })).toMatchObject({ code: 'weak_password' });
  });

  it('preserves a valid password exactly as submitted', () => {
    expect(validatePasswordResetInput({ userId: 'user', password: ' Strong!956 ' }))
      .toEqual({ userId: 'user', password: ' Strong!956 ' });
  });
});
