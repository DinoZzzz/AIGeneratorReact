import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    History,
    UserCheck,
    HelpCircle,
    BarChart3,
    Calendar,
    MoreHorizontal,
    User as UserIcon,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Wifi,
    WifiOff,
    RefreshCw,
    CloudOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { prefetchCommonRoutes } from '../lib/routePrefetch';

interface LayoutProps {
    children: React.ReactNode;
}

const offlineTranslations = {
    hr: {
        online: 'Online',
        offline: 'Offline',
        pendingChanges: 'promjena na čekanju',
        syncing: 'Sinkronizacija...',
        tapToSync: 'Sinkroniziraj',
    },
    en: {
        online: 'Online',
        offline: 'Offline',
        pendingChanges: 'pending changes',
        syncing: 'Syncing...',
        tapToSync: 'Sync now',
    },
};

export const Layout = ({ children }: LayoutProps) => {
    const { signOut, user, profile, lowBandwidthMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { isOnline, pendingChanges, syncStatus, triggerSync } = useOffline();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const ot = offlineTranslations[language as keyof typeof offlineTranslations] || offlineTranslations.en;

    // Prefetch common routes during idle time for faster navigation
    useEffect(() => {
        prefetchCommonRoutes();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isAdmin = profile?.role === 'admin';

    const allNavigation = [
        { name: t('nav.platform'), href: '/', icon: LayoutDashboard },
        { name: t('nav.history'), href: '/history', icon: History },
        { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
        { name: t('nav.examiners'), href: '/examiners', icon: UserCheck, adminOnly: true },
        { name: t('nav.customers'), href: '/customers', icon: Users },
        { name: t('nav.chat'), href: '/chat', icon: MessageSquare },
        { name: t('nav.settings'), href: '/settings', icon: Settings },
        { name: t('nav.analytics'), href: '/analytics', icon: BarChart3 },
        { name: t('nav.help'), href: '/help', icon: HelpCircle },
    ];

    // Filter navigation based on low bandwidth mode
    const navigation = lowBandwidthMode
        ? allNavigation.filter(item => item.href === '/customers')
        : allNavigation.filter(item => !item.adminOnly || isAdmin);

    // Get current page title
    const currentPage = navigation.find(item => item.href === location.pathname) || { name: 'AIGenerator' };

    // Check if we should show offline status (offline or has pending changes)
    const showOfflineStatus = !isOnline || pendingChanges > 0;

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden lg:flex lg:flex-col bg-card border-r border-border shadow-sm transition-all duration-300",
                isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo & Toggle */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                        <span className={cn(
                            "font-bold text-primary transition-all",
                            isSidebarCollapsed ? "text-lg" : "text-xl"
                        )}>
                            {isSidebarCollapsed ? "AIG" : "AIGenerator"}
                        </span>
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isSidebarCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center text-sm font-medium rounded-lg transition-colors",
                                        isSidebarCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    title={isSidebarCollapsed ? item.name : undefined}
                                >
                                    <Icon className={cn(
                                        "h-5 w-5",
                                        isActive ? "text-primary" : "text-muted-foreground",
                                        !isSidebarCollapsed && "mr-3"
                                    )} />
                                    {!isSidebarCollapsed && item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="mt-auto p-3 border-t border-border sticky bottom-0 bg-card">
                        {lowBandwidthMode ? (
                            <button
                                onClick={handleSignOut}
                                className={cn(
                                    "w-full flex items-center px-4 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors",
                                    isSidebarCollapsed && "justify-center px-2"
                                )}
                                title={t('nav.signOut')}
                            >
                                <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                                {!isSidebarCollapsed && t('nav.signOut')}
                            </button>
                        ) : (
                            isSidebarCollapsed ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="flex items-center justify-center mb-3 hover:bg-accent rounded-lg py-2 transition-colors group"
                                        title="Profile"
                                    >
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-primary font-medium text-sm">
                                                    {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/profile" className="flex items-center mb-4 px-4 hover:bg-accent rounded-lg py-2 transition-colors group">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-primary font-medium text-sm">
                                                        {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-foreground truncate max-w-[140px] group-hover:text-primary transition-colors">
                                                {profile?.name && profile?.last_name
                                                    ? `${profile.name} ${profile.last_name}`
                                                    : user?.email}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                    >
                                        <LogOut className="mr-3 h-5 w-5" />
                                        {t('nav.signOut')}
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header - Sticky & Dynamic Title */}
                <div className="lg:hidden sticky top-0 z-30 flex items-center justify-center h-16 px-4 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
                    <span className="text-lg font-semibold text-foreground truncate max-w-[200px]">
                        {currentPage.name}
                    </span>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 page-transition">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation with integrated offline status */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
                {/* Offline Status Bar - Shows above navigation when offline or has pending changes */}
                {showOfflineStatus && (
                    <div className={cn(
                        "flex items-center justify-between px-4 py-2 border-b border-border",
                        !isOnline
                            ? "bg-orange-50 dark:bg-orange-950/30"
                            : "bg-yellow-50 dark:bg-yellow-950/30"
                    )}>
                        <div className="flex items-center gap-2">
                            {!isOnline ? (
                                <WifiOff className="h-4 w-4 text-orange-500" />
                            ) : pendingChanges > 0 ? (
                                <CloudOff className="h-4 w-4 text-yellow-600" />
                            ) : (
                                <Wifi className="h-4 w-4 text-green-500" />
                            )}
                            <span className={cn(
                                "text-xs font-medium",
                                !isOnline ? "text-orange-700 dark:text-orange-400" : "text-yellow-700 dark:text-yellow-400"
                            )}>
                                {syncStatus?.inProgress ? (
                                    <span className="flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        {ot.syncing} ({syncStatus.completed}/{syncStatus.total})
                                    </span>
                                ) : !isOnline ? (
                                    ot.offline
                                ) : pendingChanges > 0 ? (
                                    `${pendingChanges} ${ot.pendingChanges}`
                                ) : (
                                    ot.online
                                )}
                            </span>
                        </div>
                        {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                            <button
                                onClick={triggerSync}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {ot.tapToSync}
                            </button>
                        )}
                    </div>
                )}

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
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="flex flex-col items-center justify-center min-w-[60px] px-2 py-2 rounded-lg transition-colors text-muted-foreground"
                    >
                        <MoreHorizontal className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium">More</span>
                    </button>
                </nav>
            </div>

            {/* Mobile More Menu Modal */}
            {isMoreMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-background animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
                        <span className="text-lg font-semibold text-foreground">Menu</span>
                        <button
                            onClick={() => setIsMoreMenuOpen(false)}
                            className="p-2 -mr-2 text-muted-foreground"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Menu Content */}
                    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
                        {/* Offline Status in More Menu */}
                        {showOfflineStatus && (
                            <div className={cn(
                                "mx-4 mt-4 p-3 rounded-lg",
                                !isOnline
                                    ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                                    : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {!isOnline ? (
                                            <WifiOff className="h-5 w-5 text-orange-500" />
                                        ) : (
                                            <CloudOff className="h-5 w-5 text-yellow-600" />
                                        )}
                                        <div>
                                            <p className={cn(
                                                "text-sm font-medium",
                                                !isOnline ? "text-orange-700 dark:text-orange-400" : "text-yellow-700 dark:text-yellow-400"
                                            )}>
                                                {!isOnline ? ot.offline : `${pendingChanges} ${ot.pendingChanges}`}
                                            </p>
                                            {syncStatus?.inProgress && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                    {ot.syncing} ({syncStatus.completed}/{syncStatus.total})
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                                        <button
                                            onClick={triggerSync}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            {ot.tapToSync}
                                        </button>
                                    )}
                                </div>
                            </div>
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
                                        onClick={() => setIsMoreMenuOpen(false)}
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
                                onClick={() => setIsMoreMenuOpen(false)}
                            >
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
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
                                    setIsMoreMenuOpen(false);
                                    handleSignOut();
                                }}
                                className="w-full flex items-center px-4 py-3 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                {t('nav.signOut')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
