import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

const VERSION_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

function isNewer(deployed: string, running: string): boolean {
    const d = deployed.split('.').map(Number);
    const r = running.split('.').map(Number);
    for (let i = 0; i < Math.max(d.length, r.length); i++) {
        if ((d[i] || 0) > (r[i] || 0)) return true;
        if ((d[i] || 0) < (r[i] || 0)) return false;
    }
    return false;
}

export const UpdatePrompt = () => {
    const [show, setShow] = useState(false);
    const { t } = useLanguage();

    const checkVersion = useCallback(async () => {
        try {
            const res = await fetch(`/version.json?t=${Date.now()}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.version && isNewer(data.version, __APP_VERSION__)) {
                setShow(true);
            }
        } catch {
            // Network error — skip silently
        }
    }, []);

    useEffect(() => {
        // Listen for SW-based update detection
        const handler = () => setShow(true);
        window.addEventListener('sw-update-available', handler);

        // Also check version.json directly (catches stale SW scenarios)
        const initialCheck = window.setTimeout(checkVersion, 0);
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

        return () => {
            window.removeEventListener('sw-update-available', handler);
            window.clearTimeout(initialCheck);
            clearInterval(interval);
        };
    }, [checkVersion]);

    const handleUpdate = async () => {
        // Clear all SW caches + unregister SW, then reload fresh
        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
            }
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
        } catch {
            // Best-effort — proceed with reload regardless
        }
        window.location.href = window.location.origin + window.location.pathname;
    };

    if (!show) return null;

    return (
        <div
            role="alert"
            className={cn(
                'fixed bottom-4 right-4 left-4 sm:left-auto z-[100]',
                'flex items-center gap-3 rounded-lg border bg-card p-4 shadow-lg',
                'border-green-200 dark:border-green-800',
                'animate-in slide-in-from-bottom-4'
            )}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="flex-1 text-sm font-medium text-foreground">
                {t('update.available')}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShow(false)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    {t('update.dismiss')}
                </button>
                <button
                    onClick={handleUpdate}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                    {t('update.action')}
                </button>
            </div>
            <button
                onClick={() => setShow(false)}
                className="absolute -top-2 -right-2 rounded-full bg-card border p-1 shadow-sm hover:bg-muted transition-colors sm:hidden"
                aria-label={t('common.close')}
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
};
