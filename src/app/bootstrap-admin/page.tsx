'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { bootstrapAdminAction } from '@/app/actions/admin-actions';
import { auth } from '@/firebase/config';
import Link from 'next/link';

/**
 * Bootstrap Admin Page
 *
 * SECURITY (Zero-Trust):
 * - The client does NOT pass a raw UID to the server action.
 * - Instead, it passes a fresh Firebase ID Token which the Server Action
 *   verifies via admin.auth().verifyIdToken() before extracting the UID.
 * - The admin email is a private server-side env var (ADMIN_EMAIL, no NEXT_PUBLIC_).
 *   It is NEVER exposed to the client; if the email doesn't match, the action
 *   returns a generic "Permission denied" without revealing why.
 *
 * USE: Only needed once, to create the first admin account.
 * After bootstrapping, this page can be removed or access-restricted.
 */
export default function BootstrapAdminPage() {
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handlePromote = async () => {
        if (!auth.currentUser) return;
        setIsPending(true);
        setStatus('Verifying identity on the server...');
        setError(null);

        try {
            // Get a fresh ID Token — the server will extract the UID from this.
            // We NEVER pass user.uid directly to avoid UID spoofing attacks.
            const idToken = await auth.currentUser.getIdToken(/* forceRefresh */ true);
            const result = await bootstrapAdminAction(idToken);

            if (result.success) {
                setStatus(`✅ ${result.message} Redirecting...`);
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                setError(result.error);
                setStatus('Failed.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Client error: ${message}`);
            setStatus('Failed.');
        } finally {
            setIsPending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Bootstrap Admin</h1>
                <p className="text-zinc-400">Please log in first.</p>
                <Link href="/login" className="text-purple-400 underline mt-4">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h1 className="text-3xl font-bold mb-2">💎 Bootstrap Admin</h1>
                <p className="text-zinc-500 mb-6 text-sm">
                    One-time setup page. Your email is verified server-side
                    against the private <code>ADMIN_EMAIL</code> env var.
                </p>

                <div className="bg-zinc-800 p-4 rounded-xl mb-6 text-left">
                    <p className="text-sm text-zinc-400">Logged in as:</p>
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
                        disabled={isPending}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Verifying...' : 'Promote to Admin'}
                    </button>
                )}

                <div className="mt-6 min-h-[40px]">
                    {status && (
                        <p className={`font-medium text-sm ${status.includes('✅') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {status}
                        </p>
                    )}
                    {error && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
