export const getUnsyncedChangeCount = (pendingChanges: number, discardedChanges: number): number =>
  Math.max(0, pendingChanges) + Math.max(0, discardedChanges);

export const requiresOfflineSignOutConfirmation = (
  pendingChanges: number,
  discardedChanges: number
): boolean => getUnsyncedChangeCount(pendingChanges, discardedChanges) > 0;

/** Read the queue inside the sync lock, after stopping new account writes. */
export const signOutWithOfflineProtection = async (options: {
  readPendingCount: () => Promise<number>;
  confirmDiscard?: (count: number) => Promise<boolean>;
  cancelQueries: () => Promise<unknown>;
  signOut: () => Promise<{ error: unknown }>;
  clearData: () => Promise<void>;
}): Promise<boolean> => withOfflineSyncLock(async () => {
  suspendOfflineSession();
  let signedOut = false;
  try {
    await options.cancelQueries();
    // A storage failure must abort sign-out, never assume there is no work.
    const pendingCount = await options.readPendingCount();
    if (pendingCount > 0 && (!options.confirmDiscard || !await options.confirmDiscard(pendingCount))) return false;
    const { error } = await options.signOut();
    if (error) throw error;
    signedOut = true;
    await options.clearData();
    return true;
  } finally {
    // Failed/cancelled sign-out keeps both the session and all queued work.
    if (!signedOut) resumeOfflineSession();
  }
});
import { resumeOfflineSession, suspendOfflineSession, withOfflineSyncLock } from './offlineSessionLifecycle';
