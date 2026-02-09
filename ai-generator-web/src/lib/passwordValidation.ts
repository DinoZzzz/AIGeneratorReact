export type PasswordValidationError = 'too_short' | 'weak';

interface WeakPasswordAuthError extends Error {
  __isAuthError?: boolean;
  code?: string;
  status?: number;
}

const COMMON_WEAK_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'iloveyou',
]);

export const validatePasswordStrength = (password: string): PasswordValidationError | null => {
  const value = password.trim();
  if (value.length < 8) return 'too_short';

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const categoryCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (categoryCount < 3) return 'weak';
  if (COMMON_WEAK_PASSWORDS.has(value.toLowerCase())) return 'weak';
  if (/([a-z0-9])\1{3,}/i.test(value)) return 'weak';
  if (/(1234|abcd|qwer|password|admin|letmein|iloveyou)/i.test(value)) return 'weak';

  return null;
};

export const isWeakPasswordAuthError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const authError = error as WeakPasswordAuthError;
  const message = authError.message?.toLowerCase() || '';

  return authError.code === 'weak_password' ||
    message.includes('password is known') ||
    message.includes('weak password') ||
    message.includes('easy to guess');
};

export const createWeakPasswordError = (message: string): WeakPasswordAuthError => {
  const error = new Error(message) as WeakPasswordAuthError;
  error.__isAuthError = true;
  error.code = 'weak_password';
  error.status = 400;
  return error;
};
