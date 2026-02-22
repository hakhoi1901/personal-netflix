'use client';

import { useAuth } from '@/context/AuthContext';
import { UserPermissions } from '@/types/user';

/**
 * usePermission — Convenience hook for checking permissions in UI components.
 *
 * Returns the full permissions object and a helper `can()` function.
 *
 * Usage:
 *   const { can } = usePermission();
 *   if (can('canCreateMovie')) { ... }
 *
 *   // Or destructure specific permissions:
 *   const { permissions } = usePermission();
 *   <button disabled={!permissions.canDeleteMovie}>Delete</button>
 */
export function usePermission() {
    const { user, loading } = useAuth();

    const permissions: UserPermissions = user?.permissions ?? {
        canManageUsers: false,
        canDeleteMovie: false,
        canCreateMovie: false,
        canUpdateMovie: false,
        canViewAdminPanel: false,
        canWatchVipContent: false,
        canWatchContent: false,
        canSaveProgress: false,
    };

    function can(permission: keyof UserPermissions): boolean {
        return permissions[permission] === true;
    }

    return { permissions, can, loading };
}
