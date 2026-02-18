import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Movie, Episode } from '@/types/movie';

const COLLECTION_NAME = 'movies';

// ─── Watch Progress Types & Functions ────────────────────────────────

export interface WatchProgress {
    movieId: string;
    episodeId: string;
    lastWatchedAt: number;
}

/**
 * Save the user's current watch progress for a specific movie.
 * Uses setDoc with merge to upsert the progress document.
 * Path: users/{userId}/progress/{movieId}
 */
export async function saveWatchProgress(
    userId: string,
    movieId: string,
    episodeId: string
): Promise<void> {
    const progressRef = doc(db, 'users', userId, 'progress', movieId);
    await setDoc(progressRef, {
        movieId,
        episodeId,
        lastWatchedAt: Date.now(),
    });
}

/**
 * Fetch all watch progress documents for a given user.
 * Returns an array of WatchProgress sorted by most recently watched.
 */
export async function getUserProgress(userId: string): Promise<WatchProgress[]> {
    const progressRef = collection(db, 'users', userId, 'progress');
    const snapshot = await getDocs(progressRef);

    const progress = snapshot.docs.map((d) => ({
        ...(d.data() as WatchProgress),
    }));

    // Sort by most recently watched first
    return progress.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
}

/**
 * Fetch all movies from Firestore, ordered by creation date (newest first).
 * Returns an array of Movie objects with Firestore document IDs.
 */
export async function getAllMovies(): Promise<Movie[]> {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Movie[];
}

/**
 * Fetch a single movie document by its Firestore document ID.
 * Returns null if the document does not exist.
 */
export async function getMovieById(id: string): Promise<Movie | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as Movie;
}

/**
 * Add a new movie document to Firestore.
 * Automatically sets createdAt and updatedAt timestamps.
 * Episodes are stored as a flat array inside the document (no sub-collections).
 */
export async function addMovie(
    data: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const now = Date.now();

    // Sort episodes by their order field before saving
    const sortedEpisodes = [...data.episodes].sort((a, b) => a.order - b.order);

    // Firestore does NOT accept `undefined` as a field value.
    // Strip out any keys with undefined values (e.g. optional backdropUrl, description).
    const payload: Record<string, unknown> = {
        ...data,
        episodes: sortedEpisodes,
        isVip: data.isVip ?? false,
        createdAt: now,
        updatedAt: now,
    };
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    return docRef.id;
}

/**
 * Update an existing movie document in Firestore.
 * Merges the provided fields into the document. If episodes are included,
 * they are sorted by their order field before saving.
 * Always updates the `updatedAt` timestamp.
 */
export async function updateMovie(
    id: string,
    data: Partial<Omit<Movie, 'id' | 'createdAt'>>
): Promise<void> {
    const payload: Record<string, unknown> = {
        ...data,
        updatedAt: Date.now(),
    };

    // Sort episodes by order if they are being updated
    if (payload.episodes && Array.isArray(payload.episodes)) {
        payload.episodes = [...(payload.episodes as Episode[])].sort(
            (a, b) => a.order - b.order
        );
    }

    // Firestore does NOT accept `undefined` — strip those keys
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
    });

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, payload);
}
