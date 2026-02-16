'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AuthGuard protects all routes except /login.
 * - If user is not authenticated, redirect to /login.
 * - While checking auth state, show a loading spinner.
 * - On /login page, if already authenticated, redirect to /.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (loading) return;

        if (!user && !isLoginPage) {
            // Not logged in and not on login page → redirect to login
            router.push('/login');
        } else if (user && isLoginPage) {
            // Already logged in but on login page → redirect to dashboard
            router.push('/');
        }
    }, [user, loading, isLoginPage, router]);

    // Show loading spinner while auth state resolves
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // If not logged in and not on login page, don't render children (redirect is in progress)
    if (!user && !isLoginPage) {
        return null;
    }

    // If logged in and on login page, don't render children (redirect is in progress)
    if (user && isLoginPage) {
        return null;
    }

    return <>{children}</>;
}
