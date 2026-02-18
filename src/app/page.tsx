'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getAllMovies, getUserProgress, WatchProgress } from '@/lib/firestore';
import { Movie } from '@/types/movie';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import {
  HiOutlinePlus,
  HiOutlineFilm,
  HiOutlineArrowRightOnRectangle,
  HiOutlineMagnifyingGlass,
  HiOutlinePlayCircle,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineUsers,
} from 'react-icons/hi2';
import PageTransition from '@/components/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import { AnimatePresence, motion } from 'framer-motion';

type FilterTab = 'all' | 'movie' | 'series';

/**
 * Dashboard Page — displays all movies/series in a responsive grid.
 * Includes: "Continue Watching" row, Smart Search, and Filter tabs.
 */
export default function DashboardPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const { user } = useAuth();
  const { can } = usePermission();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesData, progressData] = await Promise.all([
          getAllMovies(),
          user?.uid ? getUserProgress(user.uid) : Promise.resolve([]),
        ]);
        setMovies(moviesData);
        setProgress(progressData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.uid]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSurpriseMe = useCallback(() => {
    if (movies.length === 0) return;
    setSurpriseLoading(true);
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    router.push(`/watch?id=${randomMovie.id}`);
  }, [movies, router]);

  // --- Filtered movies ---
  const filteredMovies = useMemo(() => {
    let result = movies;

    // Filter by category tab
    if (activeTab !== 'all') {
      result = result.filter((m) => m.category === activeTab);
    }

    // Filter by search query (movie title OR episode title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.episodes.some((ep) => ep.title.toLowerCase().includes(q))
      );
    }

    return result;
  }, [movies, activeTab, searchQuery]);

  // --- Continue Watching data ---
  const continueWatchingItems = useMemo(() => {
    if (progress.length === 0) return [];

    return progress
      .map((p) => {
        const movie = movies.find((m) => m.id === p.movieId);
        if (!movie) return null;

        const episode = movie.episodes.find((ep) => ep.id === p.episodeId);
        if (!episode) return null;

        return { movie, episode, lastWatchedAt: p.lastWatchedAt };
      })
      .filter(Boolean) as { movie: Movie; episode: { id: string; title: string; order: number }; lastWatchedAt: number }[];
  }, [progress, movies]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'series', label: 'Series' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 bg-noise font-sans text-zinc-100">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-300">
                <HiOutlineFilm className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">Horitime</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Surprise Me */}
              <button
                onClick={handleSurpriseMe}
                disabled={movies.length === 0 || surpriseLoading}
                title="Surprise Me — random movie"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineSparkles className={`w-4 h-4 ${surpriseLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Surprise Me</span>
              </button>

              {can('canCreateMovie') && (
                <Link
                  href="/admin/add"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-95"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Movie</span>
                </Link>
              )}

              {can('canManageUsers') && (
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 active:scale-95"
                >
                  <HiOutlineUsers className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Continue Watching Section ─── */}
        <AnimatePresence>
          {!loading && continueWatchingItems.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <HiOutlinePlayCircle className="w-6 h-6 text-purple-400" />
                Continue Watching
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {continueWatchingItems.map(({ movie, episode }, index) => (
                  <Link
                    key={movie.id}
                    href={`/watch?id=${movie.id}&episode=${episode.id}`}
                    className="flex-shrink-0 w-72 sm:w-80 group relative"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-purple-500/10 glow-border">
                      {/* Poster as background */}
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="320px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
                          <HiOutlinePlayCircle className="w-8 h-8 text-white fill-white/20" />
                        </div>
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-purple-300 text-xs font-semibold tracking-wide uppercase mb-1">
                          Episode {episode.order}
                        </p>
                        <h3 className="text-white font-bold text-base truncate">{movie.title}</h3>
                        <p className="text-zinc-400 text-sm truncate mt-0.5">{episode.title}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          style={{
                            width: `${Math.min(
                              ((episode.order) / movie.episodes.length) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ─── Search & Filter Bar ─── */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">My Library</h2>
              <p className="text-zinc-400 mt-1">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'title' : 'titles'}
                {activeTab !== 'all' || searchQuery ? ' found' : ' in your collection'}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl shadow-lg border border-white/5" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6">
              <HiOutlineFilm className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No movies yet</h3>
            <p className="text-zinc-500 max-w-sm mb-6">
              {can('canCreateMovie')
                ? 'Start building your personal cinema by adding your first movie or series.'
                : 'No content available yet. Check back later!'}
            </p>
            {can('canCreateMovie') && (
              <Link
                href="/admin/add"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
              >
                Add Your First Movie
              </Link>
            )}
          </div>
        )}

        {/* No results from search/filter */}
        {!loading && movies.length > 0 && filteredMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HiOutlineMagnifyingGlass className="w-10 h-10 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">No results found</h3>
            <p className="text-zinc-500 text-sm">
              Try a different search term or filter.
            </p>
          </div>
        )}

        {/* Movie grid */}
        {!loading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMovies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} isAdmin={can('canUpdateMovie')} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
