'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`relative overflow-hidden bg-zinc-800/50 rounded-xl ${className}`}>
            <motion.div
                className="absolute inset-0 -translate-x-full"
                animate={{ translateX: ['-100%', '100%'] }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                }}
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                }}
            />
        </div>
    );
}
