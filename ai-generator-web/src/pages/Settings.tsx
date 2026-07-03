import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { supabase } from '../lib/supabase';
import { Settings2, Shield } from 'lucide-react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { OfflineDataManager } from '../components/settings/OfflineDataManager';
import { CertifiersManager } from '../components/settings/CertifiersManager';
import { MaterialsManager } from '../components/settings/MaterialsManager';
import { TemplateEditor } from '../components/settings/TemplateEditor';
import { SchemeManager } from '../components/settings/SchemeManager';

export const Settings = () => {
    const { t } = useLanguage();
    const { user, profile } = useAuth();
    const { isOnline } = useOffline();
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'admin'>('general');

    useEffect(() => {
        if (profile?.role) {
            setIsAdmin(profile.role === 'admin');
        }
    }, [profile]);

    useEffect(() => {
        void checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, user?.id]);

    const checkAdminStatus = async () => {
        if (!user) return;

        if (!isOnline) {
            setIsAdmin(profile?.role === 'admin');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (!error && data && data.role === 'admin') {
                setIsAdmin(true);
                return;
            }
            setIsAdmin(false);
        } catch (err) {
            console.warn('Error checking admin status:', err);
        }
    };

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

            {activeTab === 'general' && (
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
