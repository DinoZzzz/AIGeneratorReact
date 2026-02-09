import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import {
  syncPendingOperations,
  onSyncEvent,
  isSyncInProgress,
  retryFailedOperations,
  retryFailedOperationById,
  discardFailedOperationById,
  restoreDiscardedOperationById
} from '../lib/syncService';
import {
  getDiscardedSyncOperations,
  getFailedSyncOperations,
  getSyncQueueSummary,
  resetStuckSyncOperations,
  type SyncOperation
} from '../lib/offlineDb';

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
  lastSyncTime: Date | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Debounce sync to prevent multiple rapid syncs
const SYNC_DEBOUNCE_MS = 2000;
// Check for pending changes periodically
const PENDING_CHECK_INTERVAL_MS = 10000;
// How long to display sync status after completion
const SYNC_STATUS_CLEAR_MS = 3000;

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

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    try {
      const [summary, failedOps, discardedOps] = await Promise.all([
        getSyncQueueSummary(),
        getFailedSyncOperations(),
        getDiscardedSyncOperations()
      ]);
      setPendingChanges(summary.pending + summary.failed);
      setFailedChanges(summary.failed);
      setDiscardedChanges(summary.discarded);
      setFailedOperations([...failedOps].sort((a, b) => b.timestamp - a.timestamp));
      setDiscardedOperations([...discardedOps].sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
    }
  }, []);

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
  }, [triggerSync, updatePendingCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return (
    <OfflineContext.Provider
      value={{
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
        lastSyncTime,
      }}
    >
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
