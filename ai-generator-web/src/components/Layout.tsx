import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSwipeable } from 'react-swipeable';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    History,
    UserCheck,
    HelpCircle,
    BarChart3,
    Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { signOut, user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t } = useLanguage();

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

    // Swipe handlers
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => setIsMobileMenuOpen(false),
        trackMouse: true
    });

    const swipeOpenHandlers = useSwipeable({
        onSwipedRight: () => setIsMobileMenuOpen(true),
        trackMouse: true
    });

    return (
        <div className="min-h-screen bg-background flex">
            {/* Swipe Open Area (Left Edge) */}
            <div
                {...swipeOpenHandlers}
                className="fixed inset-y-0 left-0 w-4 z-30 lg:hidden"
            />

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    {...swipeHandlers}
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                {...swipeHandlers}
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-sm transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <span className="text-xl font-bold text-primary">AIGenerator</span>
                        <button
                            className="lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X className="h-6 w-6 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="mt-auto p-4 border-t border-border sticky bottom-0 bg-card">
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
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header - Sticky & Dynamic Title */}
                <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="text-muted-foreground focus:outline-none p-2 -ml-2"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-semibold text-foreground truncate max-w-[200px]">
                        {currentPage.name}
                    </span>
                    <div className="w-10" /> {/* Spacer for centering or future action button */}
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
