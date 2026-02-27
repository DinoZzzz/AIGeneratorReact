import { memo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, FileText, CalendarPlus, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';

const QuickActionsComponent = () => {
    const { t } = useLanguage();
    const { openCommandPalette } = useKeyboardShortcuts();

    const actions = [
        {
            label: t('dashboard.quickNewCustomer'),
            icon: UserPlus,
            href: '/customers/new',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-950',
        },
        {
            label: t('dashboard.quickNewReport'),
            icon: FileText,
            href: '/reports',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-950',
        },
        {
            label: t('dashboard.quickNewAppointment'),
            icon: CalendarPlus,
            href: '/calendar',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-950',
        },
        {
            label: t('dashboard.quickSearch'),
            icon: Search,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100 dark:bg-purple-950',
            onClick: openCommandPalette,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {actions.map((action) => {
                const Icon = action.icon;

                if (action.onClick) {
                    return (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                        >
                            <div className={`flex-shrink-0 p-2 rounded-lg ${action.bg}`}>
                                <Icon className={`h-5 w-5 ${action.color}`} />
                            </div>
                            <span className="text-sm font-medium text-foreground">{action.label}</span>
                        </button>
                    );
                }

                return (
                    <Link
                        key={action.label}
                        to={action.href!}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                    >
                        <div className={`flex-shrink-0 p-2 rounded-lg ${action.bg}`}>
                            <Icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </Link>
                );
            })}
        </div>
    );
};

export const QuickActions = memo(QuickActionsComponent);
QuickActions.displayName = 'QuickActions';
