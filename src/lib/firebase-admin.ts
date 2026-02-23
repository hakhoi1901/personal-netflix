/**
 * Firebase Admin SDK Singleton
 *
 * IMPORTANT: This file must ONLY be imported in Server-side code
 * (Server Actions, Route Handlers, Server Components).
 * NEVER import this in any 'use client' component.
 *
 * Credentials are loaded from the private env var FIREBASE_ADMIN_SDK_JSON
 * which contains the full JSON of the service account key.
 * This var MUST NOT have the NEXT_PUBLIC_ prefix — it is never exposed to the browser.
 */

import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;

    if (!serviceAccountJson) {
        throw new Error(
            '[firebase-admin] FIREBASE_ADMIN_SDK_JSON env var is not set. ' +
            'Add your service account JSON to .env.local (without NEXT_PUBLIC_ prefix).'
        );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    return initializeApp({
        credential: cert(serviceAccount),
    });
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
