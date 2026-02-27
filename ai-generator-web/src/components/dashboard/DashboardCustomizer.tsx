import { memo, useState } from 'react';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { useDashboardLayout, type WidgetId } from '../../hooks/useDashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

const WIDGET_LABELS: Record<WidgetId, string> = {
    quickActions: 'dashboard.quickActions',
    pinnedItems: 'dashboard.pinnedItems',
    recentReports: 'dashboard.recentReports',
    activityFeed: 'dashboard.activityFeed',
    dashboardStats: 'dashboard.topCustomers',
    customersTable: 'dashboard.customersTable',
};

const WIDGET_ORDER: WidgetId[] = [
    'quickActions',
    'pinnedItems',
    'recentReports',
    'activityFeed',
    'dashboardStats',
    'customersTable',
];

const DashboardCustomizerComponent = () => {
    const { t } = useLanguage();
    const { toggleWidget, isVisible } = useDashboardLayout();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
            >
                <Settings2 className="h-4 w-4" />
                {t('dashboard.customize')}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-card border border-border rounded-lg shadow-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                            {t('dashboard.showWidgets')}
                        </p>
                        {WIDGET_ORDER.map((id) => (
                            <button
                                key={id}
                                onClick={() => toggleWidget(id)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                {isVisible(id) ? (
                                    <Eye className="h-4 w-4 text-primary" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                {t(WIDGET_LABELS[id])}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const DashboardCustomizer = memo(DashboardCustomizerComponent);
DashboardCustomizer.displayName = 'DashboardCustomizer';
