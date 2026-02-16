import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/types/movie';

interface MovieCardProps {
    movie: Movie;
}

/**
 * MovieCard displays a movie/series poster with title and category badge.
 * Links to the watch page on click.
 */
export default function MovieCard({ movie }: MovieCardProps) {
    return (
        <Link href={`/watch/${movie.id}`} className="group block">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-purple-500/10">
                {/* Poster Image */}
                <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md ${movie.category === 'series'
                                ? 'bg-indigo-500/80 text-white'
                                : 'bg-purple-500/80 text-white'
                            }`}
                    >
                        {movie.category === 'series' ? 'Series' : 'Movie'}
                    </span>
                </div>

                {/* Episode count for series */}
                {movie.category === 'series' && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-lg bg-black/50 text-zinc-300 backdrop-blur-md">
                            {movie.episodes.length} eps
                        </span>
                    </div>
                )}

                {/* Title at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                        {movie.title}
                    </h3>
                    {movie.description && (
                        <p className="text-zinc-400 text-xs mt-1 line-clamp-1">
                            {movie.description}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
