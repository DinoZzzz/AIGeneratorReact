import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
    ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { signOut, user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isAdmin = profile?.role === 'admin';

    const navigation = [
        { name: t('nav.platform'), href: '/', icon: LayoutDashboard },
        { name: t('nav.history'), href: '/history', icon: History },
        { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
        { name: t('nav.examiners'), href: '/examiners', icon: UserCheck, adminOnly: true },
        { name: t('nav.customers'), href: '/customers', icon: Users },
        { name: t('nav.settings'), href: '/settings', icon: Settings },
        { name: t('nav.analytics'), href: '/analytics', icon: BarChart3 },
        { name: t('nav.help'), href: '/help', icon: HelpCircle },
    ].filter(item => !item.adminOnly || isAdmin);

    // Get current page title
    const currentPage = navigation.find(item => item.href === location.pathname) || { name: 'AIGenerator' };

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
                        {isSidebarCollapsed ? (
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
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 page-transition">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
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
