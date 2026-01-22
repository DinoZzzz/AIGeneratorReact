import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface DesktopSidebarProps {
    navigation: NavItem[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onSignOut: () => void;
    signOutLabel: string;
    user?: { email?: string } | null;
    profile?: {
        name?: string;
        last_name?: string;
        avatar_url?: string;
    } | null;
    lowBandwidthMode?: boolean;
}

export const DesktopSidebar = ({
    navigation,
    isCollapsed,
    onToggleCollapse,
    onSignOut,
    signOutLabel,
    user,
    profile,
    lowBandwidthMode
}: DesktopSidebarProps) => {
    const location = useLocation();

    return (
        <div className={cn(
            "hidden lg:flex lg:flex-col bg-card border-r border-border shadow-sm transition-all duration-300",
            isCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
            <div className="flex flex-col h-full">
                {/* Logo & Toggle */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    <span className={cn(
                        "font-bold text-primary transition-all",
                        isCollapsed ? "text-lg" : "text-xl"
                    )}>
                        {isCollapsed ? "AIG" : "AIGenerator"}
                    </span>
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
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
                                    isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <Icon className={cn(
                                    "h-5 w-5",
                                    isActive ? "text-primary" : "text-muted-foreground",
                                    !isCollapsed && "mr-3"
                                )} />
                                {!isCollapsed && item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="mt-auto p-3 border-t border-border sticky bottom-0 bg-card">
                    {lowBandwidthMode ? (
                        <button
                            onClick={onSignOut}
                            className={cn(
                                "w-full flex items-center px-4 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={signOutLabel}
                        >
                            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                            {!isCollapsed && signOutLabel}
                        </button>
                    ) : (
                        isCollapsed ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="flex items-center justify-center mb-3 hover:bg-accent rounded-lg py-2 transition-colors group"
                                    title="Profile"
                                >
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="text-primary font-medium text-sm">
                                                {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={onSignOut}
                                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                    aria-label="Sign Out"
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
                                                <img
                                                    src={profile.avatar_url}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
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
                                    onClick={onSignOut}
                                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                >
                                    <LogOut className="mr-3 h-5 w-5" />
                                    {signOutLabel}
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
