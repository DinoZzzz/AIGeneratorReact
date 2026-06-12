import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  syncPendingOperations,
  onSyncEvent,
  isSyncInProgress,
  retryFailedOperations,
  retryFailedOperationById,
  discardFailedOperationById,
  restoreDiscardedOperationById,
  resolveConflictUseServerById,
  resolveConflictPreferLocalById
} from '../lib/syncService';
import {
  getDiscardedSyncOperations,
  getFailedSyncOperations,
  getSyncQueueSummary,
  cleanupStaleUploadOperations,
  resetStuckSyncOperations,
  type SyncOperation
} from '../lib/offlineDb';
import { captureError, logger } from '../lib/sentry';

interface SyncStatus {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingChanges: number;
  failedChanges: number;
  discardedChanges: number;
  failedOperations: SyncOperation[];
  discardedOperations: SyncOperation[];
  syncStatus: SyncStatus | null;
  triggerSync: () => Promise<void>;
  retryFailedSync: () => Promise<void>;
  retryFailedOperation: (operationId: string) => Promise<void>;
  discardFailedOperation: (operationId: string) => Promise<void>;
  restoreDiscardedOperation: (operationId: string) => Promise<void>;
  resolveConflictUseServer: (operationId: string) => Promise<void>;
  resolveConflictPreferLocal: (operationId: string) => Promise<void>;
  lastSyncTime: Date | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Debounce sync to prevent multiple rapid syncs
const SYNC_DEBOUNCE_MS = 2000;
// Check for pending changes periodically
const PENDING_CHECK_INTERVAL_MS = 10000;
// Best-effort periodic auto-sync while online and app is open.
const AUTO_SYNC_INTERVAL_MS = 60000;
// How long to display sync status after completion
const SYNC_STATUS_CLEAR_MS = 3000;
// Queue cleanup interval to bound offline upload blob storage.
const UPLOAD_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// The queue is polled every PENDING_CHECK_INTERVAL_MS; keep previous state
// references when nothing changed so consumers don't re-render on every poll.
const areOperationListsEqual = (a: SyncOperation[], b: SyncOperation[]): boolean =>
  a.length === b.length &&
  a.every((op, index) => {
    const other = b[index];
    return (
      op.id === other.id &&
      op.status === other.status &&
      op.retryCount === other.retryCount &&
      op.timestamp === other.timestamp &&
      op.error === other.error
    );
  });

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [failedChanges, setFailedChanges] = useState(0);
  const [discardedChanges, setDiscardedChanges] = useState(0);
  const [failedOperations, setFailedOperations] = useState<SyncOperation[]>([]);
  const [discardedOperations, setDiscardedOperations] = useState<SyncOperation[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingSync = useRef(false);
  const lastUploadCleanupAtRef = useRef(0);

  const runUploadQueueCleanup = useCallback(async (force = false) => {
    if (!force && Date.now() - lastUploadCleanupAtRef.current < UPLOAD_CLEANUP_INTERVAL_MS) {
      return;
    }

    lastUploadCleanupAtRef.current = Date.now();
    const cleanupResult = await cleanupStaleUploadOperations();
    if (cleanupResult.removed > 0) {
      logger.warn('Offline upload queue cleanup removed stale items', cleanupResult);
    }
  }, []);

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    try {
      await runUploadQueueCleanup();
      const [summary, failedOps, discardedOps] = await Promise.all([
        getSyncQueueSummary(),
        getFailedSyncOperations(),
        getDiscardedSyncOperations()
      ]);
      setPendingChanges(summary.pending + summary.failed);
      setFailedChanges(summary.failed);
      setDiscardedChanges(summary.discarded);
      const sortedFailed = [...failedOps].sort((a, b) => b.timestamp - a.timestamp);
      const sortedDiscarded = [...discardedOps].sort((a, b) => b.timestamp - a.timestamp);
      setFailedOperations((prev) => (areOperationListsEqual(prev, sortedFailed) ? prev : sortedFailed));
      setDiscardedOperations((prev) => (areOperationListsEqual(prev, sortedDiscarded) ? prev : sortedDiscarded));
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
    }
  }, [runUploadQueueCleanup]);

  // Trigger sync with debouncing
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    if (isSyncInProgress()) {
      hasPendingSync.current = true;
      return;
    }

    // Clear any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await syncPendingOperations();
        if (result.total > 0) {
          setLastSyncTime(new Date());
        }
        await updatePendingCount();

        // If there was a pending sync request, trigger another sync
        if (hasPendingSync.current) {
          hasPendingSync.current = false;
          // Recursive call is intentional for retry logic
          // eslint-disable-next-line
          triggerSync();
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [updatePendingCount]);

  const retryFailedSync = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const retriedCount = await retryFailedOperations();
      await updatePendingCount();
      if (retriedCount > 0) {
        await triggerSync();
      }
    } catch (error) {
      console.error('Failed to retry sync operations:', error);
    }
  }, [triggerSync, updatePendingCount]);

  const retryFailedOperation = useCallback(async (operationId: string) => {
    if (!navigator.onLine) return;
    try {
      const didQueueRetry = await retryFailedOperationById(operationId);
      await updatePendingCount();
      if (didQueueRetry) {
        await triggerSync();
      }
    } catch (error) {
      console.error('Failed to retry sync operation:', error);
    }
  }, [triggerSync, updatePendingCount]);

  const discardFailedOperation = useCallback(async (operationId: string) => {
    try {
      await discardFailedOperationById(operationId);
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to discard sync operation:', error);
    }
  }, [updatePendingCount]);

  const restoreDiscardedOperation = useCallback(async (operationId: string) => {
    if (!navigator.onLine) return;
    try {
      const restored = await restoreDiscardedOperationById(operationId);
      await updatePendingCount();
      if (restored) {
        await triggerSync();
      }
    } catch (error) {
      console.error('Failed to restore sync operation:', error);
    }
  }, [triggerSync, updatePendingCount]);

  const resolveConflictUseServer = useCallback(async (operationId: string) => {
    if (!navigator.onLine) return;
    try {
      const resolved = await resolveConflictUseServerById(operationId);
      await updatePendingCount();
      if (resolved) {
        await triggerSync();
      }
    } catch (error) {
      console.error('Failed to resolve sync conflict:', error);
    }
  }, [triggerSync, updatePendingCount]);

  const resolveConflictPreferLocal = useCallback(async (operationId: string) => {
    if (!navigator.onLine) return;
    try {
      const resolved = await resolveConflictPreferLocalById(operationId);
      await updatePendingCount();
      if (resolved) {
        await triggerSync();
      }
    } catch (error) {
      console.error('Failed to resolve sync conflict preferring local version:', error);
    }
  }, [triggerSync, updatePendingCount]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Listen to sync events
  useEffect(() => {
    const unsubscribe = onSyncEvent((event) => {
      switch (event.type) {
        case 'sync_start':
          setSyncStatus({
            total: event.total || 0,
            completed: 0,
            failed: 0,
            inProgress: true,
          });
          break;
        case 'sync_progress':
          setSyncStatus({
            total: event.total || 0,
            completed: event.completed || 0,
            failed: event.failed || 0,
            inProgress: true,
          });
          break;
        case 'sync_complete':
          setSyncStatus({
            total: event.total || 0,
            completed: event.completed || 0,
            failed: event.failed || 0,
            inProgress: false,
          });
          void updatePendingCount();
          // Clear sync status after a delay
          setTimeout(() => setSyncStatus(null), SYNC_STATUS_CLEAR_MS);
          break;
        case 'sync_error':
          setSyncStatus((prev) =>
            prev ? { ...prev, inProgress: false } : null
          );
          void updatePendingCount();
          break;
        case 'sync_operation':
          if (event.outcome === 'failure') {
            logger.error('Offline sync operation failed', {
              scope: event.scope,
              store: event.store,
              operation: event.operation,
              entityId: event.entityId,
              kind: event.kind,
              error: event.error,
            });
            if (event.error) {
              captureError(new Error(event.error), {
                scope: event.scope,
                store: event.store,
                operation: event.operation,
                entityId: event.entityId,
                kind: event.kind,
                telemetry: 'offline_sync',
              });
            }
            break;
          }

          logger.info('Offline sync operation telemetry', {
            scope: event.scope,
            outcome: event.outcome,
            store: event.store,
            operation: event.operation,
            entityId: event.entityId,
            kind: event.kind,
          });
          break;
      }
    });

    return unsubscribe;
  }, [updatePendingCount]);

  // Periodically check for pending changes
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, PENDING_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Recover interrupted sync state and then attempt sync if online
  useEffect(() => {
    const initializeOfflineSync = async () => {
      try {
        await runUploadQueueCleanup(true);
        const recoveredCount = await resetStuckSyncOperations();
        if (recoveredCount > 0) {
          await updatePendingCount();
        }
      } catch (error) {
        console.error('Failed to recover interrupted sync operations:', error);
      }

      if (navigator.onLine) {
        await triggerSync();
      }
    };

    void initializeOfflineSync();
  }, [runUploadQueueCleanup, triggerSync, updatePendingCount]);

  // Best-effort periodic sync while the app remains open.
  useEffect(() => {
    if (!isOnline || pendingChanges === 0) {
      return;
    }

    const interval = setInterval(() => {
      void triggerSync();
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOnline, pendingChanges, triggerSync]);

  // Trigger sync whenever app tab/window becomes active again.
  useEffect(() => {
    const triggerForegroundSync = () => {
      if (!navigator.onLine) return;
      if (document.visibilityState !== 'visible') return;
      void triggerSync();
    };

    window.addEventListener('focus', triggerForegroundSync);
    document.addEventListener('visibilitychange', triggerForegroundSync);

    return () => {
      window.removeEventListener('focus', triggerForegroundSync);
      document.removeEventListener('visibilitychange', triggerForegroundSync);
    };
  }, [triggerSync]);

  // Receive sync completion messages from service worker background sync.
  useEffect(() => {
    const handleServiceWorkerSyncResult = (event: Event) => {
      const customEvent = event as CustomEvent<{ total?: number }>;
      if ((customEvent.detail?.total || 0) > 0) {
        setLastSyncTime(new Date());
      }
      void updatePendingCount();
    };

    window.addEventListener('offline-sync-result', handleServiceWorkerSyncResult as EventListener);
    return () => {
      window.removeEventListener('offline-sync-result', handleServiceWorkerSyncResult as EventListener);
    };
  }, [updatePendingCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      pendingChanges,
      failedChanges,
      discardedChanges,
      failedOperations,
      discardedOperations,
      syncStatus,
      triggerSync,
      retryFailedSync,
      retryFailedOperation,
      discardFailedOperation,
      restoreDiscardedOperation,
      resolveConflictUseServer,
      resolveConflictPreferLocal,
      lastSyncTime,
    }),
    [
      isOnline,
      pendingChanges,
      failedChanges,
      discardedChanges,
      failedOperations,
      discardedOperations,
      syncStatus,
      triggerSync,
      retryFailedSync,
      retryFailedOperation,
      discardFailedOperation,
      restoreDiscardedOperation,
      resolveConflictUseServer,
      resolveConflictPreferLocal,
      lastSyncTime,
    ]
  );

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
