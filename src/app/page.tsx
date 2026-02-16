'use client';

import { useEffect, useState } from 'react';
import { getAllMovies } from '@/lib/firestore';
import { Movie } from '@/types/movie';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { HiOutlinePlus, HiOutlineFilm, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';

/**
 * Dashboard Page — displays all movies/series in a responsive grid.
 * Uses client-side fetching since Firestore client SDK is browser-only.
 */
export default function DashboardPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMovies() {
      try {
        const data = await getAllMovies();
        setMovies(data);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <HiOutlineFilm className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Theater</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/add"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-95"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Movie</span>
              </Link>

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
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            My Library
          </h2>
          <p className="text-zinc-400 mt-1">
            {movies.length} {movies.length === 1 ? 'title' : 'titles'} in your collection
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-800/50 animate-pulse" />
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
              Start building your personal cinema by adding your first movie or series.
            </p>
            <Link
              href="/admin/add"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
            >
              Add Your First Movie
            </Link>
          </div>
        )}

        {/* Movie grid */}
        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
