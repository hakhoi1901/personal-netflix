'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { addMovie } from '@/lib/firestore';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineFilm,
} from 'react-icons/hi2';

interface EpisodeInput {
    title: string;
    driveId: string;
}

interface FormData {
    title: string;
    posterUrl: string;
    backdropUrl: string;
    description: string;
    category: 'movie' | 'series';
    isCompleted: boolean;
    episodes: EpisodeInput[];
}

/**
 * Admin Add Page — Dynamic form for adding movies and series.
 * Uses react-hook-form with useFieldArray for dynamic episode management.
 */
export default function AdminAddPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            title: '',
            posterUrl: '',
            backdropUrl: '',
            description: '',
            category: 'movie',
            isCompleted: true,
            episodes: [{ title: 'Full Movie', driveId: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'episodes',
    });

    const category = watch('category');

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            // Convert form episodes to the Episode type with IDs and order
            const episodes = data.episodes.map((ep, index) => ({
                id: uuidv4(),
                title: ep.title,
                driveId: ep.driveId,
                order: index + 1,
            }));

            await addMovie({
                title: data.title,
                posterUrl: data.posterUrl,
                backdropUrl: data.backdropUrl || undefined,
                description: data.description || undefined,
                category: data.category,
                isCompleted: data.isCompleted,
                episodes,
            });

            router.push('/');
        } catch (err) {
            console.error('Failed to add movie:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Library</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10" />
                        <h1 className="text-sm font-medium text-white">Add New Title</h1>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* --- Basic Info Section --- */}
                    <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <HiOutlineFilm className="w-4 h-4 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="title"
                                {...register('title', { required: 'Title is required' })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="e.g., Inception, Breaking Bad"
                            />
                            {errors.title && (
                                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Poster URL */}
                        <div>
                            <label htmlFor="posterUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                Poster URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="posterUrl"
                                {...register('posterUrl', { required: 'Poster URL is required' })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="https://image.tmdb.org/..."
                            />
                            {errors.posterUrl && (
                                <p className="text-red-400 text-sm mt-1">{errors.posterUrl.message}</p>
                            )}
                        </div>

                        {/* Backdrop URL */}
                        <div>
                            <label htmlFor="backdropUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                Backdrop URL <span className="text-zinc-500">(optional)</span>
                            </label>
                            <input
                                id="backdropUrl"
                                {...register('backdropUrl')}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="https://image.tmdb.org/..."
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                                Description <span className="text-zinc-500">(optional)</span>
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                {...register('description')}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                                placeholder="A brief description of the movie or series..."
                            />
                        </div>

                        {/* Category & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Category <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="category"
                                    {...register('category')}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                >
                                    <option value="movie" className="bg-zinc-900">Movie</option>
                                    <option value="series" className="bg-zinc-900">Series</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="isCompleted" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Status
                                </label>
                                <select
                                    id="isCompleted"
                                    {...register('isCompleted', { setValueAs: (v) => v === 'true' })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                >
                                    <option value="true" className="bg-zinc-900">Completed</option>
                                    <option value="false" className="bg-zinc-900">Ongoing</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* --- Episodes Section --- */}
                    <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-indigo-400 text-sm font-bold">#</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        {category === 'movie' ? 'Video Source' : 'Episodes'}
                                    </h2>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {category === 'movie'
                                            ? 'Add the Google Drive file ID for the movie'
                                            : 'Add Drive IDs for each episode'}
                                    </p>
                                </div>
                            </div>

                            {/* Add Episode Button */}
                            <button
                                type="button"
                                onClick={() => append({ title: '', driveId: '' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-medium rounded-lg transition-all"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        {/* Validation: at least 1 episode */}
                        {fields.length === 0 && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-red-400 text-sm">At least one episode is required.</p>
                            </div>
                        )}

                        {/* Episode Rows */}
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl group"
                                >
                                    {/* Episode number indicator */}
                                    <div className="flex-shrink-0 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mt-0.5">
                                        <span className="text-zinc-500 text-xs font-mono">{index + 1}</span>
                                    </div>

                                    {/* Episode Title */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            {...register(`episodes.${index}.title` as const, {
                                                required: 'Episode title is required',
                                            })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                            placeholder={category === 'movie' ? 'Full Movie' : `Episode ${index + 1}`}
                                        />
                                        {errors.episodes?.[index]?.title && (
                                            <p className="text-red-400 text-xs mt-1">
                                                {errors.episodes[index]?.title?.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Drive ID */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            {...register(`episodes.${index}.driveId` as const, {
                                                required: 'Drive ID is required',
                                            })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                                            placeholder="Google Drive File ID"
                                        />
                                        {errors.episodes?.[index]?.driveId && (
                                            <p className="text-red-400 text-xs mt-1">
                                                {errors.episodes[index]?.driveId?.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        disabled={fields.length <= 1}
                                        className="flex-shrink-0 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-0.5"
                                        title="Remove episode"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Submit Button */}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={submitting || fields.length === 0}
                            className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98]"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Adding...
                                </span>
                            ) : (
                                `Add ${category === 'movie' ? 'Movie' : 'Series'}`
                            )}
                        </button>

                        <Link
                            href="/"
                            className="px-6 py-3.5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
