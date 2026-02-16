'use client';

import { Episode } from '@/types/movie';
import { HiOutlinePlayCircle } from 'react-icons/hi2';

interface EpisodeListProps {
    episodes: Episode[];
    currentEpisodeId: string;
    onSelect: (episode: Episode) => void;
    movieTitle: string;
}

/**
 * EpisodeList renders a scrollable episode selector.
 * - Highlights the currently playing episode.
 * - Calls onSelect() when user clicks a different episode.
 * - Sorted by episode order field.
 */
export default function EpisodeList({
    episodes,
    currentEpisodeId,
    onSelect,
    movieTitle,
}: EpisodeListProps) {
    // Ensure episodes are sorted by their order field
    const sortedEpisodes = [...episodes].sort((a, b) => a.order - b.order);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-white font-semibold text-lg truncate">{movieTitle}</h2>
                <p className="text-zinc-400 text-sm mt-0.5">
                    {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                </p>
            </div>

            {/* Episode list - scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                    {sortedEpisodes.map((episode) => {
                        const isActive = episode.id === currentEpisodeId;
                        return (
                            <button
                                key={episode.id}
                                onClick={() => onSelect(episode)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left ${isActive
                                        ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                                        : 'hover:bg-white/5 text-zinc-300 hover:text-white border border-transparent'
                                    }`}
                            >
                                {/* Play icon */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isActive
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-white/10 text-zinc-400'
                                        }`}
                                >
                                    {isActive ? (
                                        <div className="flex items-center gap-0.5">
                                            <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                                            <span className="w-0.5 h-4 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
                                            <span className="w-0.5 h-2 bg-white rounded-full animate-pulse [animation-delay:0.4s]" />
                                        </div>
                                    ) : (
                                        <HiOutlinePlayCircle className="w-4 h-4" />
                                    )}
                                </div>

                                {/* Episode info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                                        {episode.title}
                                    </p>
                                    <p className="text-xs text-zinc-500">Episode {episode.order}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
