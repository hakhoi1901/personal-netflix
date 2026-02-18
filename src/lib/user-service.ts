import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAfter,
    doc,
    updateDoc,
    DocumentSnapshot,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { AppUser, UserRole, UserPermissions } from '@/types/user';
import { getPermissionsByRole } from '@/lib/permissions';

const USERS_COLLECTION = 'users';
const USERS_PER_PAGE = 20;

export interface UsersResponse {
    users: AppUser[];
    lastDoc: DocumentSnapshot | null;
}

/**
 * Fetch paginated users, ordered by creation time (newest first).
 */
export async function getUsers(
    lastVisible: DocumentSnapshot | null = null
): Promise<UsersResponse> {
    let q = query(
        collection(db, USERS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(USERS_PER_PAGE)
    );

    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const users: AppUser[] = [];

    snapshot.forEach((doc) => {
        // We typecast efficiently. In a real app, you might validate data.
        users.push({ uid: doc.id, ...doc.data() } as AppUser);
    });

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { users, lastDoc };
}

/**
 * Search users by email prefix.
 * Note: simplistic search. For full text search, use Algolia/Typesense.
 * This works for "starts with" queries.
 */
export async function searchUsers(emailQuery: string): Promise<AppUser[]> {
    const q = query(
        collection(db, USERS_COLLECTION),
        where('email', '>=', emailQuery),
        where('email', '<=', emailQuery + '\uf8ff'),
        limit(20)
    );

    const snapshot = await getDocs(q);
    const users: AppUser[] = [];

    snapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as AppUser);
    });

    return users;
}

/**
 * Update a user's role.
 * IMPORTANT: This resets their permissions to the default for that role!
 */
export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    const defaultPermissions = getPermissionsByRole(newRole);
    const userRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(userRef, {
        role: newRole,
        permissions: defaultPermissions,
    });
}

/**
 * Update a specific permission for a user (Granular override).
 */
export async function updateUserPermission(
    uid: string,
    permissionKey: keyof UserPermissions,
    newValue: boolean
): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // We must use dot notation to update a nested field in a map
    // e.g. "permissions.canCreateMovie": true
    await updateDoc(userRef, {
        [`permissions.${permissionKey}`]: newValue,
    });
}
