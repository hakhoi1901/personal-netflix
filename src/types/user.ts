import { User } from 'firebase/auth';

export type UserRole = 'admin' | 'editor' | 'vip' | 'user' | 'banned';

export interface UserPermissions {
    canManageUsers: boolean;     // Assign roles, ban users
    canDeleteMovie: boolean;     // Hard delete from DB
    canCreateMovie: boolean;     // Add new titles
    canUpdateMovie: boolean;     // Edit movie details
    canViewAdminPanel: boolean;  // Access /admin routes
    canWatchVipContent: boolean; // Watch VIP-only movies
    canWatchContent: boolean;    // Basic streaming access
    canSaveProgress: boolean;    // Save watch progress
}

/**
 * AppUser extends Firebase User with role label + denormalized permissions.
 * Permissions are stored directly on the Firestore user document to avoid
 * runtime role lookups on every request.
 */
export interface AppUser extends User {
    role: UserRole;
    permissions: UserPermissions;
}
