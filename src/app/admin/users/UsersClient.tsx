'use client';

import { useEffect, useState } from 'react';
import { AppUser } from '@/types/user';
import { getUsers, searchUsers } from '@/lib/user-service';
import { DocumentSnapshot } from 'firebase/firestore';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlinePencilSquare,
    HiOutlineUser,
} from 'react-icons/hi2';
import UserEditModal from '@/components/admin/UserEditModal';

export default function UsersClient() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [historyStack, setHistoryStack] = useState<DocumentSnapshot[]>([]); // To handle "Prev" page
    // Note: Firestore "Prev" is hard without caching or cursor stack.
    // simpler approach:
    // Page 1: lastDoc = null
    // Page 2: lastDoc = doc1
    // Page 3: lastDoc = doc2
    // To go back to Page 2 from 3, we pop doc2 and use doc1.

    const [editingUser, setEditingUser] = useState<AppUser | null>(null);

    // Fetch initial data
    const fetchUsers = async (startAfterDoc: DocumentSnapshot | null = null) => {
        setLoading(true);
        try {
            const { users: newUsers, lastDoc: newLastDoc } = await getUsers(startAfterDoc);
            setUsers(newUsers);
            setLastDoc(newLastDoc);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (!searchTerm) {
            fetchUsers();
        }
    }, [searchTerm]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setHistoryStack([]);
            setLastDoc(null);
            fetchUsers();
            return;
        }

        setLoading(true);
        try {
            const results = await searchUsers(searchTerm);
            setUsers(results);
            setLastDoc(null);
            setHistoryStack([]); // Clear pagination history when searching
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (!lastDoc) return;
        setHistoryStack((prev) => [...prev, lastDoc]); // Push current cursor to stack
        fetchUsers(lastDoc);
    };

    const handlePrevPage = () => {
        if (historyStack.length === 0) return;
        const newStack = [...historyStack];
        newStack.pop(); // Remove current page's start cursor
        const prevCursor = newStack.length > 0 ? newStack[newStack.length - 1] : null;
        setHistoryStack(newStack);
        fetchUsers(prevCursor);
    };

    const handleUserUpdate = () => {
        // Refresh current view
        if (searchTerm) {
            // Re-run search
            searchUsers(searchTerm).then(setUsers);
        } else {
            // Re-fetch current page
            // Logic is tricky here because we need the *start* cursor of the current page.
            // Simplified: just reload the current page using the LAST item of history stack as start cursor.
            const currentStartCursor = historyStack.length > 0 ? historyStack[historyStack.length - 1] : null;
            fetchUsers(currentStartCursor);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            User Management
                        </h1>
                        <p className="text-zinc-400 mt-1">
                            Manage roles, permissions, and access levels.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineMagnifyingGlass className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-xl leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 sm:text-sm transition-all shadow-sm"
                        />
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        Permissions
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-4 bg-white/10 rounded w-48"></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-6 bg-white/10 rounded-full w-20"></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-4 bg-white/10 rounded w-32"></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="h-8 w-8 bg-white/10 rounded ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                                                        <HiOutlineUser className="h-5 w-5 text-zinc-400" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{user.email || 'No Email'}</div>
                                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{user.uid}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        user.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            user.role === 'vip' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                user.role === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                    }`}>
                                                    {user.role ? user.role.toUpperCase() : 'USER'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs text-zinc-400 max-w-xs truncate" title={JSON.stringify(user.permissions, null, 2)}>
                                                    {Object.entries(user.permissions || {})
                                                        .filter(([, v]) => v)
                                                        .length} active permissions
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="text-purple-400 hover:text-purple-300 p-2 hover:bg-purple-500/10 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    <HiOutlinePencilSquare className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!searchTerm && (
                        <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-sm text-zinc-500">
                                Page {historyStack.length + 1}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={historyStack.length === 0 || loading}
                                    className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                >
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                    Prev
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={!lastDoc || loading || users.length < 20}
                                    className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                >
                                    Next
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUpdate={handleUserUpdate}
                />
            )}
        </div>
    );
}
