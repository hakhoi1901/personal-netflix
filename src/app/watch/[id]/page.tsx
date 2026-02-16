'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMovieById } from '@/lib/firestore';
import { Movie, Episode } from '@/types/movie';
import DrivePlayer from '@/components/DrivePlayer';
import EpisodeList from '@/components/EpisodeList';
import Link from 'next/link';
import { HiOutlineArrowLeft, HiOutlineFilm } from 'react-icons/hi2';

/**
 * WatchPage — The heart of the application.
 *
 * EPISODE HANDLING LOGIC:
 * ========================
 * 1. On mount, fetch the Movie document by its Firestore ID.
 * 2. Initialize `currentEpisode` to the FIRST episode in the sorted array.
 *    - For "movie" type: this will be the only episode (the full movie).
 *    - For "series" type: this will be Episode 1 (sorted by `order` field).
 * 3. Render the episode list on the side/bottom.
 * 4. When user clicks a different episode:
 *    - Update `currentEpisode` state → React re-renders the DrivePlayer
 *    - The DrivePlayer receives the new `driveId` and loads the new video
 *    - NO page reload needed — it's all client-side state management
 * 5. The currently active episode is highlighted in the list for clarity.
 */
export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [movie, setMovie] = useState<Movie | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchMovie() {
            try {
                const data = await getMovieById(id);
                if (!data) {
                    setError(true);
                    return;
                }
                setMovie(data);

                // Initialize to the first episode (sorted by order)
                // This works for both movies (1 episode) and series (multiple episodes)
                const sorted = [...data.episodes].sort((a, b) => a.order - b.order);
                if (sorted.length > 0) {
                    setCurrentEpisode(sorted[0]);
                }
            } catch (err) {
                console.error('Failed to fetch movie:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchMovie();
    }, [id]);

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !movie) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
                        <HiOutlineFilm className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-300">Movie not found</h2>
                    <p className="text-zinc-500">The movie you&apos;re looking for doesn&apos;t exist.</p>
                    <Link
                        href="/"
                        className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all"
                    >
                        Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Library</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10" />
                        <h1 className="text-sm font-medium text-white truncate">{movie.title}</h1>
                        {currentEpisode && movie.category === 'series' && (
                            <>
                                <div className="h-5 w-px bg-white/10" />
                                <span className="text-sm text-zinc-400 truncate">{currentEpisode.title}</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content: Player + Episode List */}
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col lg:flex-row">
                    {/* --- Video Player Section --- */}
                    <div className="flex-1 p-4 sm:p-6">
                        {currentEpisode ? (
                            <DrivePlayer driveId={currentEpisode.driveId} />
                        ) : (
                            <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
                                <p className="text-zinc-500">No episodes available</p>
                            </div>
                        )}

                        {/* Movie info below player */}
                        <div className="mt-6">
                            <h2 className="text-xl font-bold text-white">{movie.title}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${movie.category === 'series'
                                            ? 'bg-indigo-500/20 text-indigo-400'
                                            : 'bg-purple-500/20 text-purple-400'
                                        }`}
                                >
                                    {movie.category === 'series' ? 'Series' : 'Movie'}
                                </span>
                                <span className="text-zinc-500 text-sm">
                                    {movie.episodes.length} {movie.episodes.length === 1 ? 'episode' : 'episodes'}
                                </span>
                                {movie.category === 'series' && (
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-md ${movie.isCompleted
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}
                                    >
                                        {movie.isCompleted ? 'Completed' : 'Ongoing'}
                                    </span>
                                )}
                            </div>
                            {movie.description && (
                                <p className="text-zinc-400 mt-4 text-sm leading-relaxed max-w-3xl">
                                    {movie.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* --- Episode List Sidebar ---
           * Only shown when the movie has more than 1 episode (i.e., it's a series).
           * For single-episode movies, the sidebar is hidden since there's nothing to select.
           */}
                    {movie.episodes.length > 1 && currentEpisode && (
                        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-900/30">
                            <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
                                <EpisodeList
                                    episodes={movie.episodes}
                                    currentEpisodeId={currentEpisode.id}
                                    onSelect={(episode) => {
                                        // Update currentEpisode → triggers re-render of DrivePlayer with new driveId
                                        setCurrentEpisode(episode);
                                    }}
                                    movieTitle={movie.title}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
