'use client';

import { useState, useEffect } from 'react';
import { AppUser, UserRole, UserPermissions } from '@/types/user';
import { getPermissionsByRole } from '@/lib/permissions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { HiOutlineXMark, HiCheck } from 'react-icons/hi2';

interface UserEditModalProps {
    user: AppUser;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
}

const ROLES: UserRole[] = ['admin', 'editor', 'vip', 'user', 'banned'];

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
    canManageUsers: 'Manage Users (Admin)',
    canDeleteMovie: 'Delete Movies',
    canCreateMovie: 'Create Movies',
    canUpdateMovie: 'Update Movies',
    canViewAdminPanel: 'Access Admin Panel',
    canWatchVipContent: 'Watch VIP Content',
    canWatchContent: 'Watch Standard Content',
    canSaveProgress: 'Save Watch Progress',
};

export default function UserEditModal({ user, onClose, onUpdate }: UserEditModalProps) {
    const [role, setRole] = useState<UserRole>(user.role || 'user');
    const [permissions, setPermissions] = useState<UserPermissions>(
        user.permissions || getPermissionsByRole(user.role || 'user')
    );
    const [loading, setLoading] = useState(false);

    // When role changes, reset permissions to default for that role
    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole);
        setPermissions(getPermissionsByRole(newRole));
    };

    const handlePermissionToggle = (key: keyof UserPermissions) => {
        setPermissions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                role,
                permissions,
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Edit User</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <HiOutlineXMark className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* User Info */}
                    <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                        <p className="text-sm text-zinc-400">Email</p>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">UID: {user.uid}</p>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Role
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {ROLES.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRoleChange(r)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${role === r
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                        }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Permissions
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.keys(permissions) as Array<keyof UserPermissions>).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handlePermissionToggle(key)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${permissions[key]
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-red-500/5 border-red-500/10 text-red-400/70 hover:bg-red-500/10'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{PERMISSION_LABELS[key]}</span>
                                    {permissions[key] && <HiCheck className="w-5 h-5 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            Note: Changing the role resets these permissions. You can toggle them individually afterwards.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-zinc-400 hover:text-white font-medium hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
