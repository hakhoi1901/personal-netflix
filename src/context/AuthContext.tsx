'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { AppUser, UserRole } from '@/types/user';
import { getPermissionsByRole } from '@/lib/permissions';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

/**
 * AuthProvider listens to Firebase auth state changes.
 * After auth resolves, it fetches the user's role + permissions from Firestore.
 * `loading` stays true until BOTH auth AND Firestore fetch are complete.
 *
 * Denormalized permissions are stored directly on the user document,
 * so we never need to re-derive them from the role at runtime.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        // Existing user: read role + permissions from Firestore
                        const data = userSnap.data();
                        const role = (data.role ?? 'user') as UserRole;
                        // Use stored permissions, but fall back to role-derived ones
                        // in case the document is missing the permissions field
                        const permissions = data.permissions ?? getPermissionsByRole(role);
                        setUser({ ...firebaseUser, role, permissions } as AppUser);
                    } else {
                        // Brand new user: check if this is the bootstrap admin
                        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                        const isBootstrapAdmin = firebaseUser.email === adminEmail;

                        const defaultRole: UserRole = isBootstrapAdmin ? 'admin' : 'user';
                        const defaultPermissions = getPermissionsByRole(defaultRole);

                        const newUserData = {
                            email: firebaseUser.email,
                            role: defaultRole,
                            permissions: defaultPermissions,
                            createdAt: serverTimestamp(),
                        };
                        await setDoc(userRef, newUserData);
                        setUser({
                            ...firebaseUser,
                            role: defaultRole,
                            permissions: defaultPermissions,
                        } as AppUser);
                    }
                } catch (err) {
                    // Firestore unavailable (offline/network error): default to 'user'
                    console.error('Failed to fetch user data from Firestore:', err);
                    setUser({
                        ...firebaseUser,
                        role: 'user',
                        permissions: getPermissionsByRole('user'),
                    } as AppUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Safety timeout: stop loading after 5s if Firebase never responds
        const timeout = setTimeout(() => setLoading(false), 5000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access the current auth state (user + role + permissions).
 */
export function useAuth() {
    return useContext(AuthContext);
}
