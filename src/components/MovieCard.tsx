import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/types/movie';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import { motion } from 'framer-motion';

interface MovieCardProps {
    movie: Movie;
    index?: number; // Added for staggered animation
    isAdmin?: boolean; // Show edit button only for admins
}

/**
 * MovieCard displays a movie/series poster with title and category badge.
 * Uses an overlay link pattern to avoid nested <a> hydration errors.
 */
export default function MovieCard({ movie, index = 0, isAdmin = false }: MovieCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group block relative"
        >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/20 glow-border">
                {/* Invisible overlay link — covers the entire card for watch navigation */}
                <Link
                    href={`/watch?id=${movie.id}`}
                    className="absolute inset-0 z-[1]"
                    aria-label={`Watch ${movie.title}`}
                />

                {/* Poster Image */}
                <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md shadow-sm ${movie.category === 'series'
                            ? 'bg-indigo-500/90 text-white'
                            : 'bg-purple-500/90 text-white'
                            }`}
                    >
                        {movie.category === 'series' ? 'Series' : 'Movie'}
                    </span>
                </div>

                {/* Edit Button — visible on hover, only for admins */}
                {isAdmin && (
                    <Link
                        href={`/admin/edit?id=${movie.id}`}
                        className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-lg text-zinc-300 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 translate-y-2 group-hover:translate-y-0"
                        title="Edit"
                    >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                    </Link>
                )}

                {/* Episode count for series */}
                {movie.category === 'series' && (
                    <div className="absolute top-12 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 translate-y-2 group-hover:translate-y-0">
                        <span className="px-2 py-1 text-xs font-medium rounded-lg bg-black/60 text-zinc-200 backdrop-blur-md border border-white/10">
                            {movie.episodes.length} eps
                        </span>
                    </div>
                )}

                {/* Title at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow-md">
                        {movie.title}
                    </h3>
                    {movie.description && (
                        <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            {movie.description}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
