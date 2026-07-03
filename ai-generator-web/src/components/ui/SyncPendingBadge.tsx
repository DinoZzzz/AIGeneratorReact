import { CloudOff } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import type { StoreName } from '../../lib/offlineDb';

/**
 * Small inline badge shown next to a record that has offline changes waiting
 * to sync (or whose sync failed). Renders nothing once the row is in sync.
 */
export const SyncPendingBadge = ({ store, entityId }: { store: StoreName; entityId?: string | number | null }) => {
    const { pendingEntityKeys } = useOffline();
    const { t } = useLanguage();

    if (entityId === null || entityId === undefined) return null;
    if (!pendingEntityKeys.has(`${store}:${entityId}`)) return null;

    return (
        <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap align-middle"
            title={t('offline.pendingBadge')}
        >
            <CloudOff className="h-3 w-3" />
            {t('offline.pendingBadge')}
        </span>
    );
};
