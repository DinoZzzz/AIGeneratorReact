import { Link, useLocation } from 'react-router-dom';
import { X, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OfflineStatusBar } from './OfflineStatusBar';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface MobileMoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navigation: NavItem[];
    onSignOut: () => void;
    signOutLabel: string;
    user?: { email?: string } | null;
    profile?: {
        name?: string;
        last_name?: string;
        avatar_url?: string;
    } | null;
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

export const MobileMoreMenu = ({
    isOpen,
    onClose,
    navigation,
    onSignOut,
    signOutLabel,
    user,
    profile,
    isOnline,
    pendingChanges,
    syncStatus,
    triggerSync,
    offlineTranslations
}: MobileMoreMenuProps) => {
    const location = useLocation();

    if (!isOpen) return null;

    const showOfflineStatus = !isOnline || pendingChanges > 0;

    return (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
                <span className="text-lg font-semibold text-foreground">Menu</span>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-muted-foreground"
                    aria-label="Close menu"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Offline Status */}
                {showOfflineStatus && (
                    <OfflineStatusBar
                        isOnline={isOnline}
                        pendingChanges={pendingChanges}
                        syncStatus={syncStatus}
                        triggerSync={triggerSync}
                        translations={offlineTranslations}
                        variant="full"
                    />
                )}

                {/* All Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={onClose}
                            >
                                <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="mt-auto p-4 border-t border-border bg-card">
                    <Link
                        to="/profile"
                        className="flex items-center mb-4 px-4 hover:bg-accent rounded-lg py-3 transition-colors group"
                        onClick={onClose}
                    >
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-primary font-medium text-base">
                                        {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {profile?.name && profile?.last_name
                                    ? `${profile.name} ${profile.last_name}`
                                    : user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">View Profile</p>
                        </div>
                        <UserIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                    <button
                        onClick={() => {
                            onClose();
                            onSignOut();
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        {signOutLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
