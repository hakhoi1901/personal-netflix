'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type Permission = 'canViewAdminPanel';

interface PermissionGuardProps {
    children: React.ReactNode;
    require: Permission;
}

/**
 * PermissionGuard restricts access based on user roles/permissions.
 * Currently, canViewAdminPanel is restricted to a specific admin email.
 */
export default function PermissionGuard({ children, require }: PermissionGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = user?.email === adminEmail;

    const hasPermission = require === 'canViewAdminPanel' ? isAdmin : false;

    useEffect(() => {
        if (!loading && !hasPermission) {
            router.push('/');
        }
    }, [hasPermission, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    if (!hasPermission) {
        return null;
    }

    return <>{children}</>;
}
