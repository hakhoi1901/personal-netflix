'use client';

import { useState, useMemo } from 'react';
import { Episode } from '@/types/movie';
import { HiOutlinePlayCircle, HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

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
 * - Includes search and "Now Playing" indicator.
 */
export default function EpisodeList({
    episodes,
    currentEpisodeId,
    onSelect,
    movieTitle,
}: EpisodeListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Ensure episodes are sorted by their order field
    const sortedEpisodes = useMemo(
        () => [...episodes].sort((a, b) => a.order - b.order),
        [episodes]
    );

    const currentEpisode = sortedEpisodes.find((ep) => ep.id === currentEpisodeId);

    // Filter episodes by search query
    const filteredEpisodes = useMemo(() => {
        if (!searchQuery.trim()) return sortedEpisodes;
        const q = searchQuery.toLowerCase().trim();
        return sortedEpisodes.filter(
            (ep) =>
                ep.title.toLowerCase().includes(q) ||
                `episode ${ep.order}`.includes(q) ||
                `tập ${ep.order}`.includes(q) ||
                String(ep.order) === q
        );
    }, [sortedEpisodes, searchQuery]);

    const showSearch = episodes.length >= 5;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
                <div className="group/title relative">
                    <h2 className="text-white font-semibold text-lg truncate">{movieTitle}</h2>
                    {/* Custom tooltip */}
                    <div className="absolute left-0 top-full mt-1 z-50 max-w-xs px-3 py-2 rounded-lg bg-zinc-800/95 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/40 text-white text-sm font-medium opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all duration-200 pointer-events-none">
                        {movieTitle}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-zinc-800/95 border-l border-t border-white/10 rotate-45" />
                    </div>
                </div>
                <p className="text-zinc-400 text-sm mt-0.5">
                    {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                </p>
            </div>

            {/* Now Playing */}
            {currentEpisode && (
                <div className="px-4 py-2.5 border-b border-white/5 bg-purple-500/5">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            <span className="w-0.5 h-2.5 bg-purple-400 rounded-full animate-pulse" />
                            <span className="w-0.5 h-3.5 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                            <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Now Playing</p>
                            <p className="text-white text-sm font-medium truncate" title={currentEpisode.title}>
                                {currentEpisode.title}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            {showSearch && (
                <div className="px-3 py-2 border-b border-white/5">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm tập..."
                            className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-white transition-colors"
                            >
                                <HiOutlineXMark className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-zinc-500 text-xs mt-1.5 px-1">
                            {filteredEpisodes.length}/{sortedEpisodes.length} tập
                        </p>
                    )}
                </div>
            )}

            {/* Episode list - scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                    {filteredEpisodes.length === 0 && searchQuery ? (
                        <div className="py-8 text-center">
                            <p className="text-zinc-500 text-sm">Không tìm thấy tập nào</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-purple-400 text-sm hover:text-purple-300 transition-colors"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        filteredEpisodes.map((episode) => {
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

                                    {/* Episode info with custom tooltip */}
                                    <div className="flex-1 min-w-0 group/ep relative">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                                            {episode.title}
                                        </p>
                                        <p className="text-xs text-zinc-500">Episode {episode.order}</p>
                                        {/* Styled tooltip */}
                                        <div className="absolute left-0 bottom-full mb-2 z-50 max-w-[280px] px-3 py-2 rounded-lg bg-zinc-800/95 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/40 text-white text-xs font-medium leading-relaxed opacity-0 invisible group-hover/ep:opacity-100 group-hover/ep:visible transition-all duration-200 pointer-events-none whitespace-normal break-words">
                                            {episode.title}
                                            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-800/95 border-r border-b border-white/10 rotate-45" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
