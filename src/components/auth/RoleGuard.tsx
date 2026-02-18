'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/types/user';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

/**
 * RoleGuard protects a route segment by checking the current user's role.
 * - If loading, shows a spinner (prevents flash of unauthorized content).
 * - If user is not logged in or role is not allowed, redirects to '/'.
 * - Renders children only when the user is authorized.
 */
export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const isAuthorized = !loading && !!user && allowedRoles.includes(user.role);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            router.push('/');
        }
    }, [user, loading, allowedRoles, router]);

    // Show spinner while loading or while redirect is in progress
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
