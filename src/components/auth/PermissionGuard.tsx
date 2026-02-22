'use client';

import { usePermission } from '@/hooks/usePermission';
import { UserPermissions } from '@/types/user';

interface PermissionGuardProps {
    children: React.ReactNode;
    require: keyof UserPermissions;
}

/**
 * PermissionGuard restricts access based on user roles/permissions fetched from Firestore.
 */
export default function PermissionGuard({ children, require }: PermissionGuardProps) {
    const { can, loading } = usePermission();

    const hasPermission = can(require);

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
