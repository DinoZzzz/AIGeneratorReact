export const isConflictErrorMessage = (message?: string): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('conflict') ||
    normalized.includes('duplicate key') ||
    normalized.includes('already exists') ||
    normalized.includes('23505') ||
    normalized.includes('409')
  );
};

interface ConflictDbErrorShape {
  code?: string | number;
  status?: string | number;
  statusCode?: string | number;
  message?: string;
  details?: string;
  hint?: string;
  cause?: unknown;
}

const STATUS_CODE_PATTERN = /\b([1-5]\d{2})\b/;

const parseStatusCode = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;
    const asNumber = Number(normalized);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }
    const match = normalized.match(STATUS_CODE_PATTERN);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
};

export const isConflictDbError = (error: unknown): boolean => {
  const visited = new Set<object>();

  const walk = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;

    const ref = value as object;
    if (visited.has(ref)) return false;
    visited.add(ref);

    const dbError = value as ConflictDbErrorShape;
    const code = String(dbError.code ?? '').trim();
    if (code === '23505' || code === '409') return true;

    const status = parseStatusCode(dbError.status) ?? parseStatusCode(dbError.statusCode);
    if (status === 409) return true;

    if (
      isConflictErrorMessage(dbError.message) ||
      isConflictErrorMessage(dbError.details) ||
      isConflictErrorMessage(dbError.hint)
    ) {
      return true;
    }

    return walk(dbError.cause);
  };

  return walk(error);
};
