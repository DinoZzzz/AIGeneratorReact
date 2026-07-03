import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface OfflineStatusBarProps {
    isOnline: boolean;
    pendingChanges: number;
    syncStatus: { inProgress: boolean; completed: number; total: number } | null;
    triggerSync: () => void;
    translations: {
        online: string;
        offline: string;
        pendingChanges: string;
        syncing: string;
        tapToSync: string;
    };
    variant?: 'compact' | 'full';
}

export const OfflineStatusBar = ({
    isOnline,
    pendingChanges,
    syncStatus,
    triggerSync,
    translations: ot,
    variant = 'compact'
}: OfflineStatusBarProps) => {
    const showStatus = !isOnline || pendingChanges > 0;

    if (!showStatus) return null;

    if (variant === 'full') {
        return (
            <div className={cn(
                "mx-4 mt-4 p-3 rounded-lg",
                !isOnline
                    ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                    : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isOnline ? (
                            <WifiOff className="h-5 w-5 text-orange-500" />
                        ) : (
                            <CloudOff className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                            <p className={cn(
                                "text-sm font-medium",
                                !isOnline ? "text-orange-700 dark:text-orange-400" : "text-yellow-700 dark:text-yellow-400"
                            )}>
                                {!isOnline ? ot.offline : `${pendingChanges} ${ot.pendingChanges}`}
                            </p>
                            {syncStatus?.inProgress && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    {ot.syncing} ({syncStatus.completed}/{syncStatus.total})
                                </p>
                            )}
                        </div>
                    </div>
                    {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                        <button
                            onClick={triggerSync}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                            aria-label={`Sync ${pendingChanges} pending changes`}
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {ot.tapToSync}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Compact variant (for bottom nav bar)
    return (
        <div className={cn(
            "flex items-center justify-between px-4 py-2 border-b border-border",
            !isOnline
                ? "bg-orange-50 dark:bg-orange-950/30"
                : "bg-yellow-50 dark:bg-yellow-950/30"
        )}>
            <div className="flex items-center gap-2">
                {!isOnline ? (
                    <WifiOff className="h-4 w-4 text-orange-500" />
                ) : pendingChanges > 0 ? (
                    <CloudOff className="h-4 w-4 text-yellow-600" />
                ) : (
                    <Wifi className="h-4 w-4 text-green-500" />
                )}
                <span className={cn(
                    "text-xs font-medium",
                    !isOnline ? "text-orange-700 dark:text-orange-400" : "text-yellow-700 dark:text-yellow-400"
                )}>
                    {syncStatus?.inProgress ? (
                        <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            {ot.syncing} ({syncStatus.completed}/{syncStatus.total})
                        </span>
                    ) : !isOnline ? (
                        ot.offline
                    ) : pendingChanges > 0 ? (
                        `${pendingChanges} ${ot.pendingChanges}`
                    ) : (
                        ot.online
                    )}
                </span>
            </div>
            {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                <button
                    onClick={triggerSync}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                    aria-label={`Sync ${pendingChanges} pending changes`}
                >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    {ot.tapToSync}
                </button>
            )}
        </div>
    );
};
