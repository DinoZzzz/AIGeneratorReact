import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Pin, X } from 'lucide-react';
import { usePinnedItems } from '../../hooks/usePinnedItems';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

const PinnedItemsComponent = () => {
    const { items, unpin } = usePinnedItems();
    const { t } = useLanguage();

    if (items.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('dashboard.pinnedItems')}
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map(item => (
                    <div
                        key={`${item.type}-${item.id}`}
                        className="group relative flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all"
                    >
                        <Link
                            to={item.path}
                            className="flex items-center gap-3 flex-1 min-w-0"
                        >
                            <span className={cn(
                                "flex-shrink-0 p-2 rounded-md",
                                item.type === 'customer'
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                            )}>
                                {item.type === 'customer'
                                    ? <Users className="h-4 w-4" />
                                    : <Building2 className="h-4 w-4" />
                                }
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {item.name}
                                </p>
                                {item.subtext && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.subtext}
                                    </p>
                                )}
                            </div>
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                unpin(item.id, item.type);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all flex-shrink-0"
                            title={t('dashboard.unpin')}
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PinnedItems = memo(PinnedItemsComponent);
PinnedItems.displayName = 'PinnedItems';
