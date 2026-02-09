import { describe, expect, it } from 'vitest';
import { getUnsyncedChangeCount, requiresOfflineSignOutConfirmation } from '../src/lib/offlineSignOutGuard';

describe('offline sign-out guard', () => {
  it('computes total unsynced count from pending and local-only changes', () => {
    expect(getUnsyncedChangeCount(3, 2)).toBe(5);
    expect(getUnsyncedChangeCount(0, 4)).toBe(4);
  });

  it('requires confirmation when any pending or local-only change exists', () => {
    expect(requiresOfflineSignOutConfirmation(1, 0)).toBe(true);
    expect(requiresOfflineSignOutConfirmation(0, 1)).toBe(true);
    expect(requiresOfflineSignOutConfirmation(0, 0)).toBe(false);
  });
});
