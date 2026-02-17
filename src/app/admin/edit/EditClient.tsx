'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMovieById, updateMovie } from '@/lib/firestore';
import { Movie } from '@/types/movie';
import { v4 as uuidv4 } from 'uuid';
import MovieForm, { MovieFormData } from '@/components/admin/MovieForm';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import Link from 'next/link';

/**
 * EditPageContent — The core logic.
 * Separated to allow Suspense boundary.
 */
function EditPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchMovie() {
            if (!id) {
                setLoading(false);
                setNotFound(true);
                return;
            }

            try {
                const data = await getMovieById(id);
                if (!data) {
                    setNotFound(true);
                } else {
                    setMovie(data);
                }
            } catch (err) {
                console.error('Failed to fetch movie:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        fetchMovie();
    }, [id]);

    const handleUpdate = async (data: MovieFormData) => {
        if (!id) return;
        setSubmitting(true);
        try {
            const existingEpisodes = movie?.episodes ?? [];

            const episodes = data.episodes.map((ep, index) => ({
                id: existingEpisodes[index]?.id ?? uuidv4(),
                title: ep.title,
                driveId: ep.driveId,
                order: index + 1,
            }));

            await updateMovie(id, {
                title: data.title,
                posterUrl: data.posterUrl,
                backdropUrl: data.backdropUrl || undefined,
                description: data.description || undefined,
                category: data.category,
                isCompleted: data.isCompleted,
                episodes,
            });

            router.push(`/watch?id=${id}`);
        } catch (err) {
            console.error('Failed to update movie:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm font-medium">Loading movie data...</p>
                </div>
            </div>
        );
    }

    if (notFound || !movie) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <span className="text-red-400 text-2xl">!</span>
                    </div>
                    <h2 className="text-white text-lg font-semibold">Movie Not Found</h2>
                    <p className="text-zinc-400 text-sm max-w-xs">
                        The movie you&apos;re trying to edit doesn&apos;t exist or has been removed.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5 mb-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-16 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10" />
                        <h1 className="text-lg font-semibold text-white">Edit Movie</h1>
                    </div>
                </div>
            </header>

            <MovieForm
                initialData={movie}
                onSubmit={handleUpdate}
                submitting={submitting}
            />
        </div>
    );
}

/**
 * EditClient — Suspense wrapper for proper static export support.
 */
export default function EditClient() {
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
            <EditPageContent />
        </Suspense>
    );
}
