import { User } from 'firebase/auth';

export type UserRole = 'admin' | 'user';

/**
 * Extends the Firebase User object with an application-level role.
 * The role is fetched from the 'users' Firestore collection.
 */
export interface AppUser extends User {
    role: UserRole;
}
