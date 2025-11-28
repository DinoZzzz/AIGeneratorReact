import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  hr: {
    online: 'Online',
    offline: 'Offline',
    pendingChanges: 'promjena na čekanju',
    syncing: 'Sinkronizacija...',
    syncComplete: 'Sinkronizirano',
    syncFailed: 'Sinkronizacija nije uspjela',
    tapToSync: 'Kliknite za sinkronizaciju',
    lastSync: 'Zadnja sinkronizacija',
    noConnection: 'Nema internetske veze',
    workingOffline: 'Radite offline',
  },
  en: {
    online: 'Online',
    offline: 'Offline',
    pendingChanges: 'pending changes',
    syncing: 'Syncing...',
    syncComplete: 'Synced',
    syncFailed: 'Sync failed',
    tapToSync: 'Click to sync',
    lastSync: 'Last sync',
    noConnection: 'No internet connection',
    workingOffline: 'Working offline',
  },
};

export const OfflineIndicator = () => {
  const { isOnline, pendingChanges, syncStatus, triggerSync, lastSyncTime } = useOffline();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [showDetails, setShowDetails] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState(false);

  // Show completion indicator briefly
  useEffect(() => {
    if (syncStatus && !syncStatus.inProgress && syncStatus.completed > 0) {
      setRecentlyCompleted(true);
      const timer = setTimeout(() => setRecentlyCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Don't show indicator when online with no pending changes and not syncing
  if (isOnline && pendingChanges === 0 && !syncStatus?.inProgress && !recentlyCompleted) {
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
    if (pendingChanges > 0) {
      return 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700';
    }
    return 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
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
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {getStatusText()}
        </span>
      </button>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
            <span className="font-semibold text-gray-900 dark:text-white">
              {isOnline ? t.online : t.noConnection}
            </span>
          </div>

          {!isOnline && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t.lastSync}: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}

          {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
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
          )}

          {syncStatus?.failed && syncStatus.failed > 0 && (
            <p className="text-xs text-red-500 mt-2">
              {syncStatus.failed} {t.syncFailed}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
