'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';

interface TeaserProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  className?: string;
}

export default function TeaserVideo({ 
  src, 
  fallbackSrc, 
  poster, 
  className = "w-full h-full object-cover" 
}: TeaserProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleViewportEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleViewportLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <motion.div
      onViewportEnter={handleViewportEnter}
      onViewportLeave={handleViewportLeave}
      viewport={{ once: false, amount: 0.5 }}
      className="w-full h-full"
    >
      <video
        ref={videoRef}
        className={className}
        muted
        loop
        controls
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} type="video/quicktime" />
        {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
        <p className="absolute inset-0 flex items-center justify-center text-gray-500">
          Your browser doesn't support video playback. 
          <a href={src} className="ml-1 underline">Download the video</a>
        </p>
      </video>
    </motion.div>
  );
}