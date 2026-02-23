'use server';

/**
 * Zero-Trust Server Actions
 *
 * SECURITY PRINCIPLES:
 * 1. The UID is NEVER accepted as a raw parameter from the client.
 *    Instead, we accept a Firebase ID Token, verify it server-side,
 *    and extract the UID from the verified payload.
 * 2. Secret env vars (ADMIN_EMAIL, FIREBASE_ADMIN_SDK_JSON) stay on the server only.
 *    No NEXT_PUBLIC_ prefix → never bundled into the client JS.
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPermissionsByRole, CURRENT_PERMISSIONS_VERSION } from '@/lib/permissions';
import { UserRole } from '@/types/user';
import { FieldValue } from 'firebase-admin/firestore';

// The current version of the permission schema.
// Bump this number whenever you change PERMISSION_MATRIX in permissions.ts.

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a Firebase ID Token and returns the verified UID.
 * Throws an Error if the token is invalid or expired.
 */
async function getVerifiedUid(idToken: string): Promise<string> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION 1: bootstrapAdminAction
// ─────────────────────────────────────────────────────────────────────────────

export type BootstrapResult =
    | { success: true; message: string }
    | { success: false; error: string };

/**
 * Promotes a user to Admin if their email matches the secret ADMIN_EMAIL env var.
 *
 * @param idToken - A fresh Firebase ID Token from `await user.getIdToken()`.
 *                  The UID is extracted server-side; never passed as a raw parameter.
 */
export async function bootstrapAdminAction(idToken: string): Promise<BootstrapResult> {
    try {
        // 1. Verify the token and get the trusted UID from Firebase.
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        // 2. Compare email against the PRIVATE server-only env var.
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            return { success: false, error: 'Server misconfiguration: ADMIN_EMAIL not set.' };
        }

        if (email !== adminEmail) {
            // Do not reveal that the email didn't match — just deny.
            return { success: false, error: 'Permission denied.' };
        }

        // 3. Use Admin SDK to write directly to Firestore — bypasses Security Rules.
        const userRef = adminDb.collection('users').doc(uid);
        const adminPermissions = getPermissionsByRole('admin');

        await userRef.set(
            {
                email,
                role: 'admin' as UserRole,
                permissions: { ...adminPermissions, version: CURRENT_PERMISSIONS_VERSION },
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        return { success: true, message: 'Successfully promoted to Admin.' };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[bootstrapAdminAction] Error:', message);
        return { success: false, error: `Server error: ${message}` };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION 2: syncUserPermissionsAction
// ─────────────────────────────────────────────────────────────────────────────

export type SyncResult =
    | { success: true; synced: boolean }
    | { success: false; error: string };

/**
 * Checks if a user's stored permissions are outdated and re-syncs them to their role.
 * Called from AuthContext on every login when the stored version is stale.
 *
 * @param idToken - A fresh Firebase ID Token. UID is extracted server-side.
 */
export async function syncUserPermissionsAction(idToken: string): Promise<SyncResult> {
    try {
        const uid = await getVerifiedUid(idToken);

        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return { success: false, error: 'User document not found.' };
        }

        const data = userSnap.data()!;
        const storedVersion: number = data.permissions?.version ?? 0;

        // If the user's permission version matches current, no sync needed.
        if (storedVersion >= CURRENT_PERMISSIONS_VERSION) {
            return { success: true, synced: false };
        }

        // Re-derive permissions from the user's current role.
        const role = (data.role ?? 'user') as UserRole;
        const freshPermissions = getPermissionsByRole(role);

        await userRef.update({
            permissions: { ...freshPermissions, version: CURRENT_PERMISSIONS_VERSION },
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, synced: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[syncUserPermissionsAction] Error:', message);
        return { success: false, error: `Server error: ${message}` };
    }
}
