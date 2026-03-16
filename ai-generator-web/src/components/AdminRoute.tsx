import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Route wrapper that only allows admin users.
 * Non-admin users are redirected to the home page.
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (profile?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
