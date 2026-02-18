import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Admin Layout — wraps all routes under /admin with a RoleGuard.
 * Only users with the 'admin' role can access these pages.
 * Everyone else is redirected to the homepage.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['admin']}>
            {children}
        </RoleGuard>
    );
}
