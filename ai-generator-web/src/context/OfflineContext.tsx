import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { syncPendingOperations, onSyncEvent, isSyncInProgress } from '../lib/syncService';
import { getPendingSyncCount } from '../lib/offlineDb';

interface SyncStatus {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingChanges: number;
  syncStatus: SyncStatus | null;
  triggerSync: () => Promise<void>;
  lastSyncTime: Date | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Debounce sync to prevent multiple rapid syncs
const SYNC_DEBOUNCE_MS = 2000;
// Check for pending changes periodically
const PENDING_CHECK_INTERVAL_MS = 10000;

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingSync = useRef(false);

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingChanges(count);
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
          triggerSync();
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [updatePendingCount]);

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
          // Clear sync status after a delay
          setTimeout(() => setSyncStatus(null), 3000);
          break;
        case 'sync_error':
          setSyncStatus((prev) =>
            prev ? { ...prev, inProgress: false } : null
          );
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Periodically check for pending changes
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, PENDING_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Initial sync attempt on mount if online
  useEffect(() => {
    if (navigator.onLine) {
      triggerSync();
    }
  }, [triggerSync]);

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
        syncStatus,
        triggerSync,
        lastSyncTime,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
