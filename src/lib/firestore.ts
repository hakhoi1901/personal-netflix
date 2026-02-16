import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Movie, Episode } from '@/types/movie';

const COLLECTION_NAME = 'movies';

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
        createdAt: now,
        updatedAt: now,
    };
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    return docRef.id;
}
