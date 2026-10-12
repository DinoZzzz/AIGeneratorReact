import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Settings2, Shield } from 'lucide-react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { OfflineDataManager } from '../components/settings/OfflineDataManager';
import { CertifiersManager } from '../components/settings/CertifiersManager';
import { MaterialsManager } from '../components/settings/MaterialsManager';
import { TemplateEditor } from '../components/settings/TemplateEditor';
import { SchemeManager } from '../components/settings/SchemeManager';

export const Settings = () => {
    const { t } = useLanguage();
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const [activeTab, setActiveTab] = useState<'general' | 'admin'>('general');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('nav.settings')}</h1>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'general'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                >
                    <Settings2 className="h-4 w-4" />
                    {t('settings.generalTab')}
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'admin'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        <Shield className="h-4 w-4" />
                        {t('settings.adminTab')}
                    </button>
                )}
            </div>

            {(activeTab === 'general' || !isAdmin) && (
                <div className="space-y-6 sm:space-y-8">
                    <GeneralSettings />
                    <OfflineDataManager />
                </div>
            )}

            {activeTab === 'admin' && isAdmin && (
                <div className="space-y-6 sm:space-y-8">
                    <CertifiersManager />
                    <MaterialsManager isAdmin={isAdmin} />
                    <TemplateEditor />
                    <SchemeManager />
                </div>
            )}
        </div>
    );
};
