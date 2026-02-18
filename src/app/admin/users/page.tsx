import PermissionGuard from '@/components/auth/PermissionGuard';
import UsersClient from './UsersClient';

export default function UsersPage() {
    return (
        <PermissionGuard require="canManageUsers">
            <UsersClient />
        </PermissionGuard>
    );
}
