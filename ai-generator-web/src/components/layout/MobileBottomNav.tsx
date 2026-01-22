import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OfflineStatusBar } from './OfflineStatusBar';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface MobileBottomNavProps {
    navigation: NavItem[];
    onMoreClick: () => void;
    isOnline: boolean;
    pendingChanges: number;
    syncStatus: { inProgress: boolean; completed: number; total: number } | null;
    triggerSync: () => void;
    offlineTranslations: {
        online: string;
        offline: string;
        pendingChanges: string;
        syncing: string;
        tapToSync: string;
    };
}

export const MobileBottomNav = ({
    navigation,
    onMoreClick,
    isOnline,
    pendingChanges,
    syncStatus,
    triggerSync,
    offlineTranslations
}: MobileBottomNavProps) => {
    const location = useLocation();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
            {/* Offline Status Bar */}
            <OfflineStatusBar
                isOnline={isOnline}
                pendingChanges={pendingChanges}
                syncStatus={syncStatus}
                triggerSync={triggerSync}
                translations={offlineTranslations}
                variant="compact"
            />

            {/* Navigation Items */}
            <nav className="flex items-center justify-around px-2 py-2">
                {navigation.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] px-2 py-2 rounded-lg transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("h-6 w-6 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-medium truncate max-w-full">{item.name}</span>
                        </Link>
                    );
                })}
                {/* More Button */}
                <button
                    onClick={onMoreClick}
                    className="flex flex-col items-center justify-center min-w-[60px] px-2 py-2 rounded-lg transition-colors text-muted-foreground"
                    aria-label="More options"
                >
                    <MoreHorizontal className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">More</span>
                </button>
            </nav>
        </div>
    );
};
