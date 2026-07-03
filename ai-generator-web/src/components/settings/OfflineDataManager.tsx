import { useEffect, useState } from 'react';
import { CloudDownload, Database, HardDrive, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';

const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
};

interface StorageInfo {
    usage: number;
    quota: number;
    persisted: boolean;
}

export const OfflineDataManager = () => {
    const { t } = useLanguage();
    const { isOnline, downloadForOffline, downloadStatus, lastPulledAt } = useOffline();
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [downloading, setDownloading] = useState(false);

    const refreshStorageInfo = async () => {
        try {
            const [estimate, persisted] = await Promise.all([
                navigator.storage?.estimate?.() ?? Promise.resolve(undefined),
                navigator.storage?.persisted?.() ?? Promise.resolve(false),
            ]);
            setStorageInfo({
                usage: estimate?.usage || 0,
                quota: estimate?.quota || 0,
                persisted: Boolean(persisted),
            });
        } catch {
            setStorageInfo(null);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => void refreshStorageInfo(), 0);
        return () => window.clearTimeout(timeout);
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadForOffline();
        } finally {
            setDownloading(false);
            void refreshStorageInfo();
        }
    };

    const busy = downloading || Boolean(downloadStatus?.inProgress);
    const buttonLabel = busy && downloadStatus?.phase === 'files' && downloadStatus.total > 0
        ? `${t('offline.downloadingFiles')} (${downloadStatus.completed}/${downloadStatus.total})`
        : busy
            ? t('offline.downloadingRecords')
            : t('offline.downloadAll');

    return (
        <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
                <Database className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">{t('offline.dataTitle')}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('offline.dataDescription')}</p>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('offline.lastSynced')}</span>
                    <span className="text-foreground">
                        {lastPulledAt ? lastPulledAt.toLocaleString() : t('offline.never')}
                    </span>
                </div>

                {storageInfo && (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <HardDrive className="h-4 w-4" />
                                {t('offline.storageUsage')}
                            </span>
                            <span className="text-foreground">
                                {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('offline.persistentStorage')}</span>
                            {storageInfo.persisted ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <ShieldCheck className="h-4 w-4" />
                                    {t('offline.protected')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <ShieldAlert className="h-4 w-4" />
                                    {t('offline.notProtected')}
                                </span>
                            )}
                        </div>
                    </>
                )}

                <button
                    onClick={handleDownload}
                    disabled={!isOnline || busy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                    {buttonLabel}
                </button>
                {!isOnline && (
                    <p className="text-xs text-muted-foreground">{t('offline.downloadRequiresConnection')}</p>
                )}
            </div>
        </section>
    );
};
