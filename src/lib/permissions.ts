import { UserRole, UserPermissions } from '@/types/user';

/**
 * Permission Matrix — Single source of truth for role → permissions mapping.
 * Used when creating a new user or when an admin updates a user's role.
 * Storing permissions denormalized on the user document avoids runtime role lookups.
 */
const PERMISSION_MATRIX: Record<UserRole, UserPermissions> = {
    admin: {
        canManageUsers: true,
        canDeleteMovie: true,
        canCreateMovie: true,
        canUpdateMovie: true,
        canViewAdminPanel: true,
        canWatchVipContent: true,
        canWatchContent: true,
        canSaveProgress: true,
    },
    editor: {
        canManageUsers: false,
        canDeleteMovie: false,
        canCreateMovie: true,
        canUpdateMovie: true,
        canViewAdminPanel: true,
        canWatchVipContent: true,
        canWatchContent: true,
        canSaveProgress: true,
    },
    vip: {
        canManageUsers: false,
        canDeleteMovie: false,
        canCreateMovie: false,
        canUpdateMovie: false,
        canViewAdminPanel: false,
        canWatchVipContent: true,
        canWatchContent: true,
        canSaveProgress: true,
    },
    user: {
        canManageUsers: false,
        canDeleteMovie: false,
        canCreateMovie: false,
        canUpdateMovie: false,
        canViewAdminPanel: false,
        canWatchVipContent: false,
        canWatchContent: true,
        canSaveProgress: true,
    },
    banned: {
        canManageUsers: false,
        canDeleteMovie: false,
        canCreateMovie: false,
        canUpdateMovie: false,
        canViewAdminPanel: false,
        canWatchVipContent: false,
        canWatchContent: false,
        canSaveProgress: false,
    },
};

/**
 * Returns the default permissions object for a given role.
 * Call this when creating a new user or when updating a user's role.
 */
export function getPermissionsByRole(role: UserRole): UserPermissions {
    return { ...PERMISSION_MATRIX[role] };
}
