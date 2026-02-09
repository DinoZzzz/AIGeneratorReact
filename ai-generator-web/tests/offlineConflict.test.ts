import { describe, expect, it } from 'vitest';
import { isConflictErrorMessage } from '../src/lib/offlineConflict';

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
});

