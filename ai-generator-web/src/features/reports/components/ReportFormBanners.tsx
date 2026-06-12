import { Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

interface ReportFormBannersProps {
    showRestoreBanner: boolean;
    lastSaved: Date | null;
    onRestore: () => void;
    onDiscard: () => void;
}

/** Auto-save restore banner + auto-saved indicator shared by the report forms. */
export const ReportFormBanners = ({ showRestoreBanner, lastSaved, onRestore, onDiscard }: ReportFormBannersProps) => {
    const { t } = useLanguage();

    return (
        <>
            {/* Auto-save restore banner */}
            {showRestoreBanner && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-800 dark:text-blue-300">{t('form.draftFound')}</p>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={onDiscard}>
                            <X className="h-3 w-3 mr-1" />
                            {t('form.discardDraft')}
                        </Button>
                        <Button size="sm" onClick={onRestore}>
                            <Check className="h-3 w-3 mr-1" />
                            {t('form.restoreDraft')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Auto-save indicator */}
            {lastSaved && !showRestoreBanner && (
                <p className="text-xs text-muted-foreground text-right">{t('form.autoSaved')}</p>
            )}
        </>
    );
};
