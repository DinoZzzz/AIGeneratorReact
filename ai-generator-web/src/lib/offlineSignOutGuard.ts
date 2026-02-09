export const getUnsyncedChangeCount = (pendingChanges: number, discardedChanges: number): number =>
  Math.max(0, pendingChanges) + Math.max(0, discardedChanges);

export const requiresOfflineSignOutConfirmation = (
  pendingChanges: number,
  discardedChanges: number
): boolean => getUnsyncedChangeCount(pendingChanges, discardedChanges) > 0;
