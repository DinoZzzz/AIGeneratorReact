import { useLanguage } from '../context/LanguageContext';

export const Help = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('help.title')}</h1>
            <div className="bg-card border border-border rounded-lg p-6 shadow">
                <p className="text-muted-foreground">{t('help.comingSoon')}</p>
            </div>
        </div>
    );
};
