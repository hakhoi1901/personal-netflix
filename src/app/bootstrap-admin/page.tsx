'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getPermissionsByRole } from '@/lib/permissions';
import Link from 'next/link';

export default function BootstrapAdminPage() {
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<string>('Waiting for user...');
    const [error, setError] = useState<string | null>(null);

    const handlePromote = async () => {
        if (!user) return;
        setStatus('Attempting to promote...');
        setError(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            const adminPerms = getPermissionsByRole('admin');

            // Try to update
            await updateDoc(userRef, {
                role: 'admin',
                permissions: adminPerms,
            });

            setStatus('Success! You are now an Admin. Please refresh the page.');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'permission-denied') {
                setError('PERMISSION DENIED. You have already deployed strict security rules. You MUST use the Firebase Console to manually update your user document.');
            } else {
                setError(`Error: ${err.message}`);
            }
            setStatus('Failed.');
        }
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    if (!user) return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Bootstrap Admin</h1>
            <p>Please log in first.</p>
            <Link href="/login" className="text-purple-400 underline mt-4">Go to Login</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h1 className="text-3xl font-bold mb-2">💎 Become Admin</h1>
                <p className="text-zinc-500 mb-6">
                    This is a temporary page to bootstrap your first admin account.
                    If strict security rules are already deployed, this will fail.
                </p>

                <div className="bg-zinc-800 p-4 rounded-xl mb-6 text-left">
                    <p className="text-sm text-zinc-400">Current User:</p>
                    <p className="font-mono text-emerald-400">{user.email}</p>
                    <p className="text-sm text-zinc-400 mt-2">Current Role:</p>
                    <p className="font-mono text-yellow-400">{user.role}</p>
                </div>

                {user.role === 'admin' ? (
                    <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20">
                        ✅ You are already an Admin!
                        <Link href="/" className="block mt-4 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-500">
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <button
                        onClick={handlePromote}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                    >
                        Promote to Admin
                    </button>
                )}

                <div className="mt-6 min-h-[60px]">
                    <p className={`font-medium ${status.includes('Success') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {status}
                    </p>
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                            <div className="mt-2 text-xs text-zinc-500">
                                Tip: Go to Firebase Console &gt; Firestore &gt; users &gt; {user.uid} &gt; change role to &quot;admin&quot; manually.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
