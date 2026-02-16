'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMovie } from '@/lib/firestore';
import { v4 as uuidv4 } from 'uuid';
import MovieForm, { MovieFormData } from '@/components/admin/MovieForm';

/**
 * Admin Add Page — Thin wrapper around the reusable MovieForm component.
 * Handles the create-specific submission logic.
 */
export default function AdminAddPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async (data: MovieFormData) => {
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
        <MovieForm
            onSubmit={handleCreate}
            submitting={submitting}
        />
    );
}
