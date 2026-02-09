import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/useConfirm';
import type { StoreName } from '../lib/offlineDb';
import { isConflictErrorMessage } from '../lib/offlineConflict';

const translations = {
  hr: {
    online: 'Online',
    offline: 'Offline',
    pendingChanges: 'promjena na čekanju',
    syncing: 'Sinkronizacija...',
    syncComplete: 'Sinkronizirano',
    syncFailed: 'Sinkronizacija nije uspjela',
    retryFailed: 'Pokušaj ponovno',
    tapToSync: 'Kliknite za sinkronizaciju',
    lastSync: 'Zadnja sinkronizacija',
    noConnection: 'Nema internetske veze',
    workingOffline: 'Radite offline',
    failedItems: 'Neuspjele promjene',
    retryOne: 'Ponovi',
    discardOne: 'Odbaci',
    customers: 'Naručitelji',
    constructions: 'Gradilišta',
    reports: 'Izvještaji',
    appointments: 'Termin',
    messages: 'Poruke',
    examiners: 'Ispitivači',
    materials: 'Materijali',
    schemeImages: 'Sheme',
    certifiers: 'Certifikatori',
    exportHistory: 'Povijest izvoza',
    create: 'kreiranje',
    update: 'ažuriranje',
    delete: 'brisanje',
    unknownError: 'Nepoznata greška',
    localOnlyChanges: 'Lokalne promjene (bez sinkronizacije)',
    restoreOne: 'Vrati u sinkronizaciju',
    useServerVersion: 'Koristi verziju sa servera',
    discardConfirmTitle: 'Odbaciti sinkronizaciju za ovu promjenu?',
    discardConfirmDescription: 'Promjena će ostati samo lokalno na ovom uređaju i neće se poslati u bazu.',
  },
  en: {
    online: 'Online',
    offline: 'Offline',
    pendingChanges: 'pending changes',
    syncing: 'Syncing...',
    syncComplete: 'Synced',
    syncFailed: 'Sync failed',
    retryFailed: 'Retry failed',
    tapToSync: 'Click to sync',
    lastSync: 'Last sync',
    noConnection: 'No internet connection',
    workingOffline: 'Working offline',
    failedItems: 'Failed changes',
    retryOne: 'Retry',
    discardOne: 'Discard',
    customers: 'Customers',
    constructions: 'Constructions',
    reports: 'Reports',
    appointments: 'Appointments',
    messages: 'Messages',
    examiners: 'Examiners',
    materials: 'Materials',
    schemeImages: 'Schemes',
    certifiers: 'Certifiers',
    exportHistory: 'Export history',
    create: 'create',
    update: 'update',
    delete: 'delete',
    unknownError: 'Unknown error',
    localOnlyChanges: 'Local-only changes (excluded from sync)',
    restoreOne: 'Restore to sync',
    useServerVersion: 'Use server version',
    discardConfirmTitle: 'Discard sync for this change?',
    discardConfirmDescription: 'The change will stay local on this device and will not be sent to the database.',
  },
};

const COMPLETION_DISPLAY_MS = 3000;

export const OfflineIndicator = () => {
  const {
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
    lastSyncTime
  } = useOffline();
  const confirm = useConfirm();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [showDetails, setShowDetails] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState(false);

  // Show completion indicator briefly
  useEffect(() => {
    if (syncStatus && !syncStatus.inProgress && syncStatus.completed > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentlyCompleted(true);
      const timer = setTimeout(() => setRecentlyCompleted(false), COMPLETION_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Don't show indicator when online with no sync-related changes and not syncing
  if (isOnline && pendingChanges === 0 && discardedChanges === 0 && !syncStatus?.inProgress && !recentlyCompleted) {
    return null;
  }

  const handleClick = () => {
    if (isOnline && pendingChanges > 0 && !syncStatus?.inProgress) {
      triggerSync();
    } else {
      setShowDetails(!showDetails);
    }
  };

  const getStatusIcon = () => {
    if (syncStatus?.inProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (recentlyCompleted) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-orange-500" />;
    }
    if (discardedChanges > 0 && pendingChanges === 0) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    if (pendingChanges > 0) {
      return <CloudOff className="h-4 w-4 text-yellow-500" />;
    }
    return <Cloud className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (syncStatus?.inProgress) {
      return `${t.syncing} (${syncStatus.completed}/${syncStatus.total})`;
    }
    if (recentlyCompleted) {
      return t.syncComplete;
    }
    if (!isOnline) {
      return t.offline;
    }
    if (discardedChanges > 0 && pendingChanges === 0) {
      return `${discardedChanges} ${t.localOnlyChanges}`;
    }
    if (pendingChanges > 0) {
      return `${pendingChanges} ${t.pendingChanges}`;
    }
    return t.online;
  };

  const getBackgroundColor = () => {
    if (syncStatus?.inProgress) {
      return 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700';
    }
    if (recentlyCompleted) {
      return 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
    }
    if (!isOnline) {
      return 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700';
    }
    if (discardedChanges > 0 && pendingChanges === 0) {
      return 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700';
    }
    if (pendingChanges > 0) {
      return 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700';
    }
    return 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
  };

  const getStoreLabel = (store: StoreName) => {
    switch (store) {
      case 'customers':
        return t.customers;
      case 'constructions':
        return t.constructions;
      case 'reports':
        return t.reports;
      case 'appointments':
        return t.appointments;
      case 'messages':
        return t.messages;
      case 'examiners':
        return t.examiners;
      case 'materials':
        return t.materials;
      case 'scheme_images':
        return t.schemeImages;
      case 'certifiers':
        return t.certifiers;
      case 'export_history':
        return t.exportHistory;
      default:
        return store;
    }
  };

  const getOperationLabel = (operation: 'create' | 'update' | 'delete') => {
    switch (operation) {
      case 'create':
        return t.create;
      case 'update':
        return t.update;
      case 'delete':
        return t.delete;
      default:
        return operation;
    }
  };

  return (
    // Hidden on mobile (lg:block) since mobile has integrated offline status in bottom nav
    <div className="hidden lg:block fixed bottom-4 right-4 z-50">
      {/* Main indicator button */}
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all duration-200 hover:scale-105 ${getBackgroundColor()}`}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium text-foreground">
          {getStatusText()}
        </span>
      </button>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-card rounded-lg shadow-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
            <span className="font-semibold text-foreground">
              {isOnline ? t.online : t.noConnection}
            </span>
          </div>

          {!isOnline && (
            <p className="text-sm text-muted-foreground mb-3">
              {t.workingOffline}
            </p>
          )}

          {pendingChanges > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {pendingChanges} {t.pendingChanges}
              </span>
            </div>
          )}

          {lastSyncTime && (
            <p className="text-xs text-muted-foreground mb-3">
              {t.lastSync}: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}

          {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  triggerSync();
                  setShowDetails(false);
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t.tapToSync}
              </button>
              {failedChanges > 0 && (
                <button
                  onClick={() => {
                    retryFailedSync();
                    setShowDetails(false);
                  }}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t.retryFailed}
                </button>
              )}
            </div>
          )}

          {failedChanges > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-red-500">
                {failedChanges} {t.syncFailed}
              </p>
              <div className="max-h-52 overflow-y-auto space-y-2">
                {failedOperations.slice(0, 8).map((operation) => (
                  <div key={operation.id} className="rounded-md border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-2">
                    <p className="text-xs font-medium text-foreground">
                      {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-all">
                      {operation.error || t.unknownError}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          retryFailedOperation(operation.id);
                        }}
                        className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                      >
                        {t.retryOne}
                      </button>
                      <button
                        onClick={async () => {
                          const shouldDiscard = await confirm({
                            title: t.discardConfirmTitle,
                            description: t.discardConfirmDescription,
                            confirmLabel: t.discardOne,
                            cancelLabel: language === 'hr' ? 'Odustani' : 'Cancel',
                            variant: 'destructive',
                          });
                          if (!shouldDiscard) return;
                          await discardFailedOperation(operation.id);
                        }}
                        className="px-2 py-1 text-xs rounded bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
                      >
                        {t.discardOne}
                      </button>
                      {isConflictErrorMessage(operation.error) && (
                        <button
                          onClick={() => {
                            resolveConflictUseServer(operation.id);
                          }}
                          className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          {t.useServerVersion}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {discardedChanges > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {discardedChanges} {t.localOnlyChanges}
              </p>
              <div className="max-h-52 overflow-y-auto space-y-2">
                {discardedOperations.slice(0, 8).map((operation) => (
                  <div key={operation.id} className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-2">
                    <p className="text-xs font-medium text-foreground">
                      {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-all">
                      {operation.error || t.localOnlyChanges}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          restoreDiscardedOperation(operation.id);
                        }}
                        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        {t.restoreOne}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
