'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserPermissions } from '@/types/user';

interface PermissionGuardProps {
    children: React.ReactNode;
    /** The single permission key required to access this content */
    require: keyof UserPermissions;
    /** Where to redirect if unauthorized. Defaults to '/' */
    redirectTo?: string;
}

/**
 * PermissionGuard protects a route or UI section by checking a specific permission.
 * - While loading: shows a spinner (prevents flash of unauthorized content).
 * - Not logged in: redirects to /login.
 * - Logged in but missing permission: redirects to `redirectTo` (default: /).
 * - Authorized: renders children.
 *
 * Usage:
 *   <PermissionGuard require="canViewAdminPanel">
 *     <AdminPage />
 *   </PermissionGuard>
 */
export default function PermissionGuard({
    children,
    require: requiredPermission,
    redirectTo = '/',
}: PermissionGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const isAuthorized = !loading && !!user && user.permissions[requiredPermission] === true;

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!user.permissions[requiredPermission]) {
            router.push(redirectTo);
        }
    }, [user, loading, requiredPermission, redirectTo, router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Checking permissions...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
