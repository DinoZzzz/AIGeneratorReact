import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
    LayoutDashboard,
    Users,
    Settings,
    History,
    UserCheck,
    HelpCircle,
    BarChart3,
    Calendar,
    MessageSquare,
} from 'lucide-react';
import { prefetchCommonRoutes } from '../lib/routePrefetch';
import { DesktopSidebar, MobileBottomNav, MobileMoreMenu } from './layout';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { signOut, user, profile, lowBandwidthMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { isOnline, pendingChanges, syncStatus, triggerSync } = useOffline();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Use centralized translations for offline status
    const ot = {
        online: t('offline.online'),
        offline: t('offline.offline'),
        pendingChanges: t('offline.pendingChanges'),
        syncing: t('offline.syncing'),
        tapToSync: t('offline.tapToSync'),
    };

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

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <DesktopSidebar
                navigation={navigation}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onSignOut={handleSignOut}
                signOutLabel={t('nav.signOut')}
                user={user}
                profile={profile}
                lowBandwidthMode={lowBandwidthMode}
            />

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

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
                navigation={navigation}
                onMoreClick={() => setIsMoreMenuOpen(true)}
                isOnline={isOnline}
                pendingChanges={pendingChanges}
                syncStatus={syncStatus}
                triggerSync={triggerSync}
                offlineTranslations={ot}
            />

            {/* Mobile More Menu Modal */}
            <MobileMoreMenu
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                navigation={navigation}
                onSignOut={handleSignOut}
                signOutLabel={t('nav.signOut')}
                user={user}
                profile={profile}
                isOnline={isOnline}
                pendingChanges={pendingChanges}
                syncStatus={syncStatus}
                triggerSync={triggerSync}
                offlineTranslations={ot}
            />
        </div>
    );
};
