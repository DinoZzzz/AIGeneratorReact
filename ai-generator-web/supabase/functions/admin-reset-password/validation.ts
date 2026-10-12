type PasswordResetInput = { userId: string; password: string };
type ValidationError = { error: string; code?: string };

export const validatePasswordResetInput = (value: unknown): PasswordResetInput | ValidationError => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'Missing userId or password' };
    }
    const { userId, password } = value as Record<string, unknown>;
    if (typeof userId !== 'string' || !userId.trim() || typeof password !== 'string' || !password) {
        return { error: 'userId and password must be non-empty strings' };
    }
    if (password.trim().length < 8) {
        return { error: 'Password must be at least 8 characters long', code: 'weak_password' };
    }
    return { userId, password };
};
