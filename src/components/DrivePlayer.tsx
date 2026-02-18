'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { HiOutlineExclamationTriangle, HiPlay, HiPause } from 'react-icons/hi2';

interface DrivePlayerProps {
    driveId: string;
}

/**
 * DrivePlayer using Google Drive API for direct streaming.
 * Replaces iframe with HTML5 <video> for better control and performance.
 */
export default function DrivePlayer({ driveId }: DrivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [apiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ text: string; id: number } | null>(null);

    // Gestures state
    const lastTapRef = useRef<{ time: number; side: 'left' | 'right' } | null>(null);

    // Construct the stream URL
    const streamUrl = apiKey
        ? `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media&key=${apiKey}`
        : '';

    // Save progress helper
    const saveProgress = useCallback(() => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            if (time > 0) {
                localStorage.setItem(`theater_progress_${driveId}`, time.toString());
            }
        }
    }, [driveId]);

    // Show feedback animation
    const showFeedback = useCallback((text: string) => {
        setFeedback({ text, id: Date.now() });
        setTimeout(() => setFeedback(null), 800);
    }, []);

    // Seek helper
    const skip = useCallback((seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
            saveProgress();
            const direction = seconds > 0 ? '+' : '';
            showFeedback(`${direction}${seconds}s`);
        }
    }, [saveProgress, showFeedback]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    skip(+10);
                    break;
                case ' ':
                    e.preventDefault();
                    if (videoRef.current) {
                        if (videoRef.current.paused) videoRef.current.play();
                        else videoRef.current.pause();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [skip]);

    // Restore progress and setup auto-save
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Restore saved progress
        const savedTime = localStorage.getItem(`theater_progress_${driveId}`);
        if (savedTime) {
            const time = parseFloat(savedTime);
            if (!isNaN(time)) {
                video.currentTime = time;
            }
        }

        // Save progress every 5 seconds
        const interval = setInterval(saveProgress, 5000);

        // Save on unmount/pause
        const handlePause = () => saveProgress();
        video.addEventListener('pause', handlePause);

        return () => {
            clearInterval(interval);
            video.removeEventListener('pause', handlePause);
            saveProgress(); // Final save
        };
    }, [driveId, saveProgress]);

    // Handle touch for double tap
    const handleTouch = useCallback((side: 'left' | 'right') => {
        const now = Date.now();
        const last = lastTapRef.current;

        if (last && now - last.time < 300 && last.side === side) {
            // Double tap detected
            skip(side === 'left' ? -10 : 10);
            lastTapRef.current = null;
        } else {
            lastTapRef.current = { time: now, side };
        }
    }, [skip]);

    if (!apiKey) {
        return (
            <div className="w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                <div className="text-center px-6">
                    <HiOutlineExclamationTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-zinc-300 font-medium">API Key configuration missing</p>
                    <p className="text-zinc-500 text-sm mt-1">Please add NEXT_PUBLIC_GOOGLE_API_KEY to your .env file</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50 group">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={streamUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onError={() => setError('Failed to load video stream')}
            >
                Your browser does not support the video tag.
            </video>

            {/* Loading Indicator */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20">
                    <div className="text-center">
                        <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-zinc-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Touch Zones for Double Tap (Mobile/Tablet) */}
            <div className="absolute inset-0 flex z-10 pointer-events-none">
                {/* Left Zone - Rewind */}
                <div
                    className="w-1/3 h-full pointer-events-auto"
                    onTouchEnd={(e) => {
                        // Prevent default if it's a double tap to avoid zooming
                        handleTouch('left');
                    }}
                    onClick={() => handleTouch('left')} // Fallback for desktop testing
                />

                {/* Center Zone - Play/Pause (optional, usually handled by native controls or click) */}
                <div className="w-1/3 h-full pointer-events-none" />

                {/* Right Zone - Forward */}
                <div
                    className="w-1/3 h-full pointer-events-auto"
                    onTouchEnd={(e) => {
                        handleTouch('right');
                    }}
                    onClick={() => handleTouch('right')} // Fallback for desktop testing
                />
            </div>

            {/* Feedback Overlay (e.g., +10s) */}
            {feedback && (
                <div
                    key={feedback.id}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-ping-once"
                >
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                        {feedback.text.includes('-') ? (
                            <div className="flex items-center text-white font-bold text-lg">
                                <span>«</span>
                                <span className="ml-1">10s</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-white font-bold text-lg">
                                <span className="mr-1">10s</span>
                                <span>»</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Styles for Animation and Touch Zones */}
            <style jsx>{`
                @keyframes ping-once {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
                .animate-ping-once {
                    animation: ping-once 0.6s ease-out forwards;
                }
                
                /* Enable touch zones only on touch devices */
                @media (hover: none) and (pointer: coarse) {
                    .touch-zone {
                        pointer-events: auto;
                    }
                }
            `}</style>
        </div>
    );
}
