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
import { AppUser } from '@/types/user';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

/**
 * AuthProvider wraps the app and listens to Firebase auth state changes.
 * After auth resolves, it fetches the user's role from Firestore.
 * The `loading` flag stays true until BOTH auth AND the role fetch are complete.
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
                        // Existing user: read their role from Firestore
                        const userData = userSnap.data();
                        setUser({ ...firebaseUser, role: userData.role ?? 'user' } as AppUser);
                    } else {
                        // Brand new user: create a Firestore document with default role
                        const newUserData = {
                            email: firebaseUser.email,
                            role: 'user' as const,
                            createdAt: serverTimestamp(),
                        };
                        await setDoc(userRef, newUserData);
                        setUser({ ...firebaseUser, role: 'user' } as AppUser);
                    }
                } catch (err) {
                    // If Firestore fails (e.g. offline), default to 'user' role
                    console.error('Failed to fetch user role from Firestore:', err);
                    setUser({ ...firebaseUser, role: 'user' } as AppUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Safety timeout: if Firebase auth never responds (network issues on mobile),
        // stop loading after 5 seconds so the app can redirect to login
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

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
 * Hook to access the current auth state (user + role) from any component.
 */
export function useAuth() {
    return useContext(AuthContext);
}
