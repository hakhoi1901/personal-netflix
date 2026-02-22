'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMovieById, saveWatchProgress } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { Movie, Episode } from '@/types/movie';
import DrivePlayer from '@/components/DrivePlayer';
import EpisodeList from '@/components/EpisodeList';
import Link from 'next/link';
import {
    HiOutlineArrowLeft,
    HiOutlineFilm,
    HiOutlineForward,
    HiOutlineArrowPath,
    HiOutlineArrowsRightLeft,
    HiOutlineLockClosed,
} from 'react-icons/hi2';

/**
 * WatchPageContent — The core player logic.
 * Separated to allow Suspense boundary for useSearchParams.
 */
function WatchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { can } = usePermission();
    const id = searchParams.get('id');

    const {
        data: movie,
        isLoading,
        isError
    } = useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            if (!id) throw new Error('No ID provided');
            const data = await getMovieById(id);
            if (!data) throw new Error('Movie not found');
            return data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [shuffleMode, setShuffleMode] = useState(false);
    const [shuffledEpisodes, setShuffledEpisodes] = useState<Episode[]>([]);

    // Initialize or Update current episode
    useEffect(() => {
        if (!movie) return;

        // Ensure episodes are sorted
        const sorted = [...movie.episodes].sort((a, b) => a.order - b.order);

        // If no episodes, ensure currentEpisode is null
        if (sorted.length === 0) {
            setCurrentEpisode(null);
            return;
        }

        // If we already have a selected episode that belongs to this movie, don't overwrite it
        // (Unless we need to validate it exists, which is good practice)
        if (currentEpisode && sorted.some(ep => ep.id === currentEpisode.id)) {
            return;
        }

        // Otherwise, initialize (First load, or ID change, or invalid currentEpisode)
        const resumeEpisodeId = searchParams.get('episode');
        if (resumeEpisodeId) {
            const resumeEp = sorted.find((ep) => ep.id === resumeEpisodeId);
            setCurrentEpisode(resumeEp ?? sorted[0]);
        } else {
            setCurrentEpisode(sorted[0]);
        }

    }, [movie, searchParams, currentEpisode]); // kept currentEpisode to allow validation check

    // Reset shuffle mode when ID changes
    useEffect(() => {
        setShuffleMode(false);
    }, [id]);

    const sortedEpisodes = movie
        ? [...movie.episodes].sort((a, b) => a.order - b.order)
        : [];

    // Fisher-Yates shuffle
    const shuffleArray = useCallback((arr: Episode[]): Episode[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }, []);

    const toggleShuffleMode = useCallback(() => {
        setShuffleMode((prev) => {
            if (!prev) {
                // Turning ON — generate a new shuffled order
                setShuffledEpisodes(shuffleArray(sortedEpisodes));
            }
            return !prev;
        });
    }, [shuffleArray, sortedEpisodes]);

    const handleRandomEpisode = useCallback(() => {
        if (sortedEpisodes.length <= 1) return;
        const others = sortedEpisodes.filter((ep) => ep.id !== currentEpisode?.id);
        const randomEp = others[Math.floor(Math.random() * others.length)];
        setCurrentEpisode(randomEp);
        saveProgress(randomEp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortedEpisodes, currentEpisode]);

    // The active episode queue (shuffled or sorted)
    const activeQueue = shuffleMode ? shuffledEpisodes : sortedEpisodes;

    const currentIndex = currentEpisode
        ? activeQueue.findIndex((ep) => ep.id === currentEpisode.id)
        : -1;

    const hasNextEpisode = currentIndex >= 0 && currentIndex < activeQueue.length - 1;
    const nextEpisode = hasNextEpisode ? activeQueue[currentIndex + 1] : null;

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (isError || !movie) {
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

    // VIP content gate: block non-VIP users from watching VIP movies
    if (movie.isVip && !can('canWatchVipContent')) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                        <HiOutlineLockClosed className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-amber-400 text-sm font-semibold tracking-wide uppercase mb-2">👑 VIP Content</p>
                        <h2 className="text-xl font-bold text-white mb-2">{movie.title}</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            This content is exclusive to VIP members. Upgrade your account to watch.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
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
                        <h1 className="text-sm font-medium text-white truncate flex-1 min-w-0">{movie.title}</h1>
                        {currentEpisode && movie.category === 'series' && (
                            <>
                                <div className="h-5 w-px bg-white/10" />
                                <span className="text-sm text-zinc-400 truncate">{currentEpisode.title}</span>
                            </>
                        )}

                        {/* Episode controls — only for series with multiple episodes */}
                        {movie.episodes.length > 1 && (
                            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                                {/* Random Episode */}
                                <button
                                    onClick={handleRandomEpisode}
                                    title="Random Episode"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all text-xs font-medium"
                                >
                                    <HiOutlineArrowPath className="w-4 h-4" />
                                    <span className="hidden sm:inline">Random</span>
                                </button>

                                {/* Shuffle Mode */}
                                <button
                                    onClick={toggleShuffleMode}
                                    title={shuffleMode ? 'Shuffle: ON' : 'Shuffle: OFF'}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${shuffleMode
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <HiOutlineArrowsRightLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Shuffle</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-4 sm:p-6">
                        {currentEpisode ? (
                            <div className="space-y-4">
                                <DrivePlayer driveId={currentEpisode.driveId} />
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-2xl font-bold text-white leading-tight">
                                        {currentEpisode.title}
                                    </h1>
                                    <p className="text-zinc-400 text-sm">
                                        Episode {currentEpisode.order}
                                    </p>
                                </div>
                            </div>
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

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <h2 className="text-lg font-semibold text-zinc-200 mb-2">About {movie.title}</h2>
                            <div className="flex items-center gap-3 mb-4">
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
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                                    {movie.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {movie.episodes.length > 1 && currentEpisode && (
                        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-900/30">
                            <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
                                <EpisodeList
                                    episodes={shuffleMode ? shuffledEpisodes : movie.episodes}
                                    currentEpisodeId={currentEpisode.id}
                                    onSelect={handleEpisodeChange}
                                    movieTitle="Episodes" // Changed from movie.title
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
