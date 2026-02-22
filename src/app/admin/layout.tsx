'use client';

import PermissionGuard from '@/components/auth/PermissionGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PermissionGuard require="canViewAdminPanel">
            <div className="admin-layout">
                {children}
            </div>
        </PermissionGuard>
    );
}
