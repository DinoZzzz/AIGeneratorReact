import { describe, expect, it } from 'vitest';
import { isConflictDbError, isConflictErrorMessage } from '../src/lib/offlineConflict';

describe('offline conflict detection', () => {
  it('detects common conflict signatures', () => {
    expect(isConflictErrorMessage('Conflict: duplicate key value violates unique constraint')).toBe(true);
    expect(isConflictErrorMessage('23505 duplicate key')).toBe(true);
    expect(isConflictErrorMessage('HTTP 409')).toBe(true);
  });

  it('ignores non-conflict errors', () => {
    expect(isConflictErrorMessage('Network request failed')).toBe(false);
    expect(isConflictErrorMessage('timeout while syncing')).toBe(false);
    expect(isConflictErrorMessage(undefined)).toBe(false);
  });

  it('detects db conflicts from status and nested causes', () => {
    expect(isConflictDbError({ status: '409 Conflict', message: 'request failed' })).toBe(true);
    expect(isConflictDbError({ statusCode: 409, message: 'request failed' })).toBe(true);
    expect(isConflictDbError({ cause: { code: '23505', message: 'duplicate key value' } })).toBe(true);
  });

  it('ignores non-conflict db errors', () => {
    expect(isConflictDbError({ status: 400, message: 'bad request' })).toBe(false);
    expect(isConflictDbError({ code: 'PGRST116', message: 'No rows found' })).toBe(false);
    expect(isConflictDbError(undefined)).toBe(false);
  });
});
