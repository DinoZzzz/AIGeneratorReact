import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTheme, primaryColors } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { errorHandler } from '../../lib/errorHandler';

export const GeneralSettings = () => {
    const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [isClearing, setIsClearing] = useState(false);

    const handleClearCache = async () => {
        setIsClearing(true);
        try {
            // Clear React Query cache
            queryClient.clear();

            // Clear localStorage (except auth tokens)
            const storage: { [key: string]: string } = {};

            // Preserve Supabase auth tokens (format: sb-<project-ref>-auth-token)
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
                    const value = localStorage.getItem(key);
                    if (value) storage[key] = value;
                }
            }

            localStorage.clear();

            // Restore preserved keys
            Object.entries(storage).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Clear sessionStorage
            sessionStorage.clear();

            addToast(t('settings.cacheCleared'), 'success');

            // Reload the page to reset all state
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            const appError = errorHandler.handle(error, 'GeneralSettings');
            addToast(errorHandler.getUserMessage(appError), 'error');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Language */}
            <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{t('settings.language')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('settings.languageDescription')}</p>
                <div className="flex gap-2 sm:gap-3">
                    <button
                        onClick={() => setLanguage('hr')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md border text-sm font-medium transition-colors ${language === 'hr'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                    >
                        {t('language.croatian')}
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md border text-sm font-medium transition-colors ${language === 'en'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                    >
                        {t('language.english')}
                    </button>
                </div>
            </section>

            {/* Cache Management Section */}
            <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{t('settings.cacheManagement')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('settings.cacheDescription')}</p>
                <button
                    onClick={handleClearCache}
                    disabled={isClearing}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
                    {isClearing ? t('settings.clearing') : t('settings.clearCache')}
                </button>
                <p className="text-xs text-muted-foreground mt-3">
                    {t('settings.cacheWarning')}
                </p>
            </section>

            {/* Appearance Section */}
            <section className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">{t('settings.appearance')}</h2>
                <div className="space-y-4">
                    <div>
                        <p className="font-medium text-foreground mb-2 sm:mb-3">{t('settings.theme')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t('settings.themeDesc')}</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${theme === 'light'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400"></div>
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{t('settings.light')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-slate-400"></div>
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{t('settings.dark')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${theme === 'system'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-white to-slate-900 border-2 border-gray-400"></div>
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{t('settings.system')}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <p className="font-medium text-foreground mb-2 sm:mb-3">{t('settings.primaryColor')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t('settings.primaryColorDesc')}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                            {primaryColors.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`group relative flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg border-2 transition-all ${primaryColor.name === color.name
                                        ? 'border-primary bg-primary/10'
                                        : 'border-transparent hover:bg-muted'
                                        }`}
                                    title={color.name}
                                >
                                    <div
                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${color.class} shadow-sm ring-offset-background transition-transform group-hover:scale-110 ${primaryColor.name === color.name ? 'ring-2 ring-primary ring-offset-2' : ''
                                            }`}
                                    />
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                                        {color.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
