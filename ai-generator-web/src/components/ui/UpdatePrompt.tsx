import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

export const UpdatePrompt = () => {
    const [show, setShow] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const handler = () => setShow(true);
        window.addEventListener('sw-update-available', handler);
        return () => window.removeEventListener('sw-update-available', handler);
    }, []);

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
                    onClick={() => window.__updateSW?.(true)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                    {t('update.action')}
                </button>
            </div>
            <button
                onClick={() => setShow(false)}
                className="absolute -top-2 -right-2 rounded-full bg-card border p-1 shadow-sm hover:bg-muted transition-colors sm:hidden"
                aria-label="Close"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
};
