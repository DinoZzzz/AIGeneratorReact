import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { useConfirm } from '../context/useConfirm';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import type { StoreName } from '../lib/offlineDb';
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
    CloudOff,
    Clock,
    Building2,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getUnsyncedChangeCount, requiresOfflineSignOutConfirmation } from '../lib/offlineSignOutGuard';
import { prefetchCommonRoutes } from '../lib/routePrefetch';
import { UserAvatar } from './ui/UserAvatar';

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
        failedChanges: 'neuspjelih promjena',
        localOnlyChanges: 'lokalnih promjena',
        details: 'Detalji',
        retry: 'Ponovi',
        discard: 'Odbaci',
        restore: 'Vrati',
        localOnlyTitle: 'Lokalno bez sinkronizacije',
        discardConfirmTitle: 'Odbaciti sinkronizaciju za ovu promjenu?',
        discardConfirmDescription: 'Promjena će ostati samo lokalno na ovom uređaju i neće se poslati u bazu.',
        customers: 'Naručitelji',
        constructions: 'Gradilišta',
        reports: 'Izvještaji',
        appointments: 'Termin',
        create: 'kreiranje',
        update: 'ažuriranje',
        delete: 'brisanje',
    },
    en: {
        online: 'Online',
        offline: 'Offline',
        pendingChanges: 'pending changes',
        syncing: 'Syncing...',
        tapToSync: 'Sync now',
        failedChanges: 'failed changes',
        localOnlyChanges: 'local-only changes',
        details: 'Details',
        retry: 'Retry',
        discard: 'Discard',
        restore: 'Restore',
        localOnlyTitle: 'Local-only (excluded from sync)',
        discardConfirmTitle: 'Discard sync for this change?',
        discardConfirmDescription: 'The change will stay local on this device and will not be sent to the database.',
        customers: 'Customers',
        constructions: 'Constructions',
        reports: 'Reports',
        appointments: 'Appointments',
        create: 'create',
        update: 'update',
        delete: 'delete',
    },
};

export const Layout = ({ children }: LayoutProps) => {
    const { signOut, user, profile, lowBandwidthMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const {
        isOnline,
        pendingChanges,
        failedChanges,
        discardedChanges,
        failedOperations,
        discardedOperations,
        syncStatus,
        triggerSync,
        retryFailedSync,
        retryFailedOperation,
        discardFailedOperation,
        restoreDiscardedOperation
    } = useOffline();
    const confirm = useConfirm();
    const { items: recentItems } = useRecentlyViewed();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showMobileSyncDetails, setShowMobileSyncDetails] = useState(false);

    const ot = offlineTranslations[language as keyof typeof offlineTranslations] || offlineTranslations.en;

    // Prefetch common routes during idle time for faster navigation
    useEffect(() => {
        prefetchCommonRoutes();
    }, []);

    const handleSignOut = async () => {
        const unsyncedCount = getUnsyncedChangeCount(pendingChanges, discardedChanges);
        if (requiresOfflineSignOutConfirmation(pendingChanges, discardedChanges)) {
            const hasConfirmedSignOut = await confirm({
                title: language === 'hr'
                    ? 'Odjava će obrisati nesinkronizirane promjene'
                    : 'Sign out will remove unsynced offline changes',
                description: language === 'hr'
                    ? `Imate ${unsyncedCount} nesinkroniziranih/lokalnih promjena. Ako se sada odjavite, te promjene će biti izgubljene.`
                    : `You have ${unsyncedCount} unsynced/local changes. If you sign out now, those changes will be lost.`,
                confirmLabel: t('nav.signOut'),
                cancelLabel: t('common.cancel'),
                variant: 'destructive',
            });

            if (!hasConfirmedSignOut) {
                return;
            }
        }

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
    const showOfflineStatus = !isOnline || pendingChanges > 0 || discardedChanges > 0;
    const handleManualSync = () => {
        if (failedChanges > 0) {
            retryFailedSync();
            return;
        }
        triggerSync();
    };

    const getStoreLabel = (store: StoreName) => {
        switch (store) {
            case 'customers':
                return ot.customers;
            case 'constructions':
                return ot.constructions;
            case 'reports':
                return ot.reports;
            case 'appointments':
                return ot.appointments;
            default:
                return store;
        }
    };

    const getOperationLabel = (operation: 'create' | 'update' | 'delete') => {
        switch (operation) {
            case 'create':
                return ot.create;
            case 'update':
                return ot.update;
            case 'delete':
                return ot.delete;
            default:
                return operation;
        }
    };

    const handleDiscardFailedOperation = async (operationId: string) => {
        const shouldDiscard = await confirm({
            title: ot.discardConfirmTitle,
            description: ot.discardConfirmDescription,
            confirmLabel: ot.discard,
            cancelLabel: t('common.cancel'),
            variant: 'destructive',
        });
        if (!shouldDiscard) return;
        await discardFailedOperation(operationId);
    };

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
                            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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

                        {/* Recently Viewed Section */}
                        {!isSidebarCollapsed && recentItems.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-border">
                                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                                    <Clock className="h-3 w-3" />
                                    {t('nav.recent') || 'Recent'}
                                </div>
                                {recentItems.slice(0, 5).map((item) => {
                                    const Icon = item.type === 'customer' ? Users : item.type === 'construction' ? Building2 : FileText;
                                    return (
                                        <Link
                                            key={`${item.type}-${item.id}`}
                                            to={item.path}
                                            className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                                            <span className="truncate">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
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
                                        <UserAvatar
                                            src={profile?.avatar_url}
                                            name={profile?.name}
                                            email={user?.email}
                                            id={profile?.id}
                                            size="sm"
                                        />
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
                                        <UserAvatar
                                            src={profile?.avatar_url}
                                            name={profile?.name}
                                            email={user?.email}
                                            id={profile?.id}
                                            size="sm"
                                        />
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
                        "px-4 py-2 border-b border-border",
                        !isOnline
                            ? "bg-orange-50 dark:bg-orange-950/30"
                            : "bg-yellow-50 dark:bg-yellow-950/30"
                    )}>
                        <div className="flex items-center justify-between">
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
                                    ) : discardedChanges > 0 ? (
                                        `${discardedChanges} ${ot.localOnlyChanges}`
                                    ) : (
                                        ot.online
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {(failedChanges > 0 || discardedChanges > 0) && (
                                    <button
                                        onClick={() => setShowMobileSyncDetails(prev => !prev)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                    >
                                        {ot.details}
                                    </button>
                                )}
                                {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                                    <button
                                        onClick={handleManualSync}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        {ot.tapToSync}
                                    </button>
                                )}
                            </div>
                        </div>
                        {showMobileSyncDetails && (failedChanges > 0 || discardedChanges > 0) && (
                            <div className="mt-2 max-h-44 overflow-y-auto space-y-2">
                                {failedChanges > 0 && (
                                    <p className="text-[11px] text-red-600 dark:text-red-400">
                                        {failedChanges} {ot.failedChanges}
                                    </p>
                                )}
                                {failedOperations.slice(0, 4).map((operation) => (
                                    <div key={operation.id} className="rounded border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-2">
                                        <p className="text-[11px] font-medium text-foreground">
                                            {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 break-all mt-1">
                                            {operation.error || 'Unknown error'}
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => retryFailedOperation(operation.id)}
                                                className="px-2 py-1 text-[11px] rounded bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                {ot.retry}
                                            </button>
                                            <button
                                                onClick={() => void handleDiscardFailedOperation(operation.id)}
                                                className="px-2 py-1 text-[11px] rounded bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                            >
                                                {ot.discard}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {discardedChanges > 0 && (
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                        {discardedChanges} {ot.localOnlyChanges}
                                    </p>
                                )}
                                {discardedOperations.slice(0, 4).map((operation) => (
                                    <div key={operation.id} className="rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-2">
                                        <p className="text-[11px] font-medium text-foreground">
                                            {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 break-all mt-1">
                                            {operation.error || ot.localOnlyTitle}
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => restoreDiscardedOperation(operation.id)}
                                                className="px-2 py-1 text-[11px] rounded bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {ot.restore}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                                {!isOnline
                                                    ? ot.offline
                                                    : pendingChanges > 0
                                                        ? `${pendingChanges} ${ot.pendingChanges}`
                                                        : discardedChanges > 0
                                                            ? `${discardedChanges} ${ot.localOnlyChanges}`
                                                            : ot.online}
                                            </p>
                                            {syncStatus?.inProgress && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                    {ot.syncing} ({syncStatus.completed}/{syncStatus.total})
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(failedChanges > 0 || discardedChanges > 0) && (
                                            <button
                                                onClick={() => setShowMobileSyncDetails(prev => !prev)}
                                                className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                            >
                                                {ot.details}
                                            </button>
                                        )}
                                        {isOnline && pendingChanges > 0 && !syncStatus?.inProgress && (
                                            <button
                                                onClick={handleManualSync}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                {ot.tapToSync}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {showMobileSyncDetails && (failedChanges > 0 || discardedChanges > 0) && (
                                    <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                                        {failedChanges > 0 && (
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                {failedChanges} {ot.failedChanges}
                                            </p>
                                        )}
                                        {failedOperations.slice(0, 8).map((operation) => (
                                            <div key={operation.id} className="rounded border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-2">
                                                <p className="text-xs font-medium text-foreground">
                                                    {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 break-all mt-1">
                                                    {operation.error || 'Unknown error'}
                                                </p>
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => retryFailedOperation(operation.id)}
                                                        className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white"
                                                    >
                                                        {ot.retry}
                                                    </button>
                                                    <button
                                                        onClick={() => void handleDiscardFailedOperation(operation.id)}
                                                        className="px-2 py-1 text-xs rounded bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                    >
                                                        {ot.discard}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {discardedChanges > 0 && (
                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                {discardedChanges} {ot.localOnlyChanges}
                                            </p>
                                        )}
                                        {discardedOperations.slice(0, 8).map((operation) => (
                                            <div key={operation.id} className="rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-2">
                                                <p className="text-xs font-medium text-foreground">
                                                    {getStoreLabel(operation.store)} - {getOperationLabel(operation.operation)}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 break-all mt-1">
                                                    {operation.error || ot.localOnlyTitle}
                                                </p>
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => restoreDiscardedOperation(operation.id)}
                                                        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        {ot.restore}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                <UserAvatar
                                    src={profile?.avatar_url}
                                    name={profile?.name}
                                    email={user?.email}
                                    id={profile?.id}
                                    size="md"
                                />
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                        {profile?.name && profile?.last_name
                                            ? `${profile.name} ${profile.last_name}`
                                            : user?.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{t('common.viewProfile')}</p>
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
