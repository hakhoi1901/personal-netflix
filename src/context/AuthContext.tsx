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
import { syncUserPermissionsAction } from '@/app/actions/admin-actions';
import { CURRENT_PERMISSIONS_VERSION } from '@/lib/permissions';

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
 * SECURITY: All admin-granting logic has been moved to server-side actions.
 * The client NEVER reads ADMIN_EMAIL or self-assigns any elevated role.
 * On first login, new users are ALWAYS created with role: 'user'.
 *
 * VERSIONED PERMISSIONS: On each login, if the user's stored permission version
 * is stale, we call a Zero-Trust Server Action to re-sync permissions server-side.
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
                        const data = userSnap.data();
                        const role = (data.role ?? 'user') as UserRole;
                        let permissions = data.permissions ?? getPermissionsByRole(role);

                        // ─── Versioned Permission Sync ────────────────────────────
                        // If stored version is behind the current schema version,
                        // call Zero-Trust Server Action to re-sync. UID is extracted
                        // from the ID Token server-side — never passed as a raw param.
                        const storedVersion: number = permissions.version ?? 0;
                        if (storedVersion < CURRENT_PERMISSIONS_VERSION) {
                            try {
                                const idToken = await firebaseUser.getIdToken();
                                const result = await syncUserPermissionsAction(idToken);
                                if (result.success && result.synced) {
                                    // Re-fetch to get the freshly synced permissions
                                    const freshSnap = await getDoc(userRef);
                                    if (freshSnap.exists()) {
                                        permissions = freshSnap.data().permissions ?? permissions;
                                    }
                                }
                            } catch (syncErr) {
                                // Non-fatal — user keeps their existing permissions for this session
                                console.warn('[AuthContext] Permission sync failed:', syncErr);
                            }
                        }
                        // ─────────────────────────────────────────────────────────

                        setUser({ ...firebaseUser, role, permissions } as AppUser);
                    } else {
                        // Brand new user: ALWAYS start with 'user' role.
                        // SECURITY: Admin bootstrapping is done via /bootstrap-admin page
                        // using a Zero-Trust Server Action that checks email server-side.
                        const defaultRole: UserRole = 'user';
                        const defaultPermissions = {
                            ...getPermissionsByRole(defaultRole),
                            version: CURRENT_PERMISSIONS_VERSION,
                        };

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
                    console.error('[AuthContext] Failed to fetch user data from Firestore:', err);
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
