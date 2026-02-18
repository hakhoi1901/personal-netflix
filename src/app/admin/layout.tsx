import PermissionGuard from '@/components/auth/PermissionGuard';

/**
 * Admin Layout — protects all /admin/* routes.
 * Requires canViewAdminPanel permission. All other users are redirected to /.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <PermissionGuard require="canViewAdminPanel">
            {children}
        </PermissionGuard>
    );
}
