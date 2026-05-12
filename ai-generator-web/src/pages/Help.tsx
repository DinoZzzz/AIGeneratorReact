import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { GitBranch } from 'lucide-react';
import { cn } from '../lib/utils';
import { SupportRequestForm } from '../components/help/SupportRequestForm';
import { FAQSection } from '../components/help/FAQSection';
import { VersionHistory } from '../components/help/VersionHistory';
import { getFaqCategories } from '../components/help/faqData';
import { getVersionHistory } from '../components/help/versionHistoryData';

type TabType = 'faq' | 'support' | 'version';

export const Help = () => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('faq');

    const faqCategories = getFaqCategories(language);
    const versionHistory = getVersionHistory(language);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('help.title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('help.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'faq'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {t('help.tabs.faq')}
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'support'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {t('help.tabs.support')}
                    </button>
                    <button
                        onClick={() => setActiveTab('version')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2",
                            activeTab === 'version'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        <GitBranch className="h-4 w-4" />
                        {t('help.tabs.version')}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'faq' ? (
                <FAQSection
                    faqCategories={faqCategories}
                    onSwitchToSupport={() => setActiveTab('support')}
                    t={t}
                />
            ) : activeTab === 'support' ? (
                <SupportRequestForm />
            ) : (
                <VersionHistory versionHistory={versionHistory} language={language} />
            )}
        </div>
    );
};
