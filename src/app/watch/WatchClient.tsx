'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMovieById, saveWatchProgress } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Movie, Episode } from '@/types/movie';
import DrivePlayer from '@/components/DrivePlayer';
import EpisodeList from '@/components/EpisodeList';
import Link from 'next/link';
import {
    HiOutlineArrowLeft,
    HiOutlineFilm,
    HiOutlineForward,
} from 'react-icons/hi2';

/**
 * WatchPageContent — The core player logic.
 * Separated to allow Suspense boundary for useSearchParams.
 */
function WatchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Get ID from query param (?id=...) instead of path
    const id = searchParams.get('id');

    const [movie, setMovie] = useState<Movie | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const sortedEpisodes = movie
        ? [...movie.episodes].sort((a, b) => a.order - b.order)
        : [];

    const currentIndex = currentEpisode
        ? sortedEpisodes.findIndex((ep) => ep.id === currentEpisode.id)
        : -1;

    const hasNextEpisode = currentIndex >= 0 && currentIndex < sortedEpisodes.length - 1;
    const nextEpisode = hasNextEpisode ? sortedEpisodes[currentIndex + 1] : null;

    useEffect(() => {
        async function fetchMovie() {
            if (!id) {
                // No ID provided in URL
                setLoading(false);
                setError(true);
                return;
            }

            try {
                const data = await getMovieById(id);
                if (!data) {
                    setError(true);
                    return;
                }
                setMovie(data);

                const resumeEpisodeId = searchParams.get('episode');
                const sorted = [...data.episodes].sort((a, b) => a.order - b.order);

                if (resumeEpisodeId) {
                    const resumeEp = sorted.find((ep) => ep.id === resumeEpisodeId);
                    setCurrentEpisode(resumeEp ?? sorted[0] ?? null);
                } else if (sorted.length > 0) {
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
    }, [id, searchParams]);

    const saveProgress = useCallback(
        async (episode: Episode) => {
            if (user?.uid && movie?.id) {
                try {
                    await saveWatchProgress(user.uid, movie.id, episode.id);
                } catch (err) {
                    console.error('Failed to save progress:', err);
                }
            }
        },
        [user?.uid, movie?.id]
    );

    const handleEpisodeChange = useCallback(
        (episode: Episode) => {
            setCurrentEpisode(episode);
            saveProgress(episode);
        },
        [saveProgress]
    );

    useEffect(() => {
        if (currentEpisode && movie && user?.uid) {
            saveProgress(currentEpisode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movie?.id]);

    const handleNextEpisode = () => {
        if (nextEpisode) {
            handleEpisodeChange(nextEpisode);
        }
    };

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

            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-4 sm:p-6">
                        {currentEpisode ? (
                            <DrivePlayer driveId={currentEpisode.driveId} />
                        ) : (
                            <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
                                <p className="text-zinc-500">No episodes available</p>
                            </div>
                        )}

                        {hasNextEpisode && nextEpisode && (
                            <button
                                onClick={handleNextEpisode}
                                className="mt-4 w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl transition-all duration-200 group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
                                        Next Episode
                                    </span>
                                    <span className="text-white font-semibold mt-0.5">
                                        {nextEpisode.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    <span className="text-sm font-medium hidden sm:inline">Play</span>
                                    <HiOutlineForward className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        )}

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

                    {movie.episodes.length > 1 && currentEpisode && (
                        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-900/30">
                            <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
                                <EpisodeList
                                    episodes={movie.episodes}
                                    currentEpisodeId={currentEpisode.id}
                                    onSelect={handleEpisodeChange}
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

/**
 * WatchClient — Wraps content in Suspense for useSearchParams compatibility
 * with static export (output: 'export').
 */
export default function WatchClient() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-zinc-400">Loading...</p>
                    </div>
                </div>
            }
        >
            <WatchPageContent />
        </Suspense>
    );
}
