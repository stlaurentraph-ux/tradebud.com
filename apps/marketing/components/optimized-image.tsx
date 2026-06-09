'use client';

import Image from 'next/image';
import { useState } from 'react';
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse z-10" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoadingComplete={() => setIsLoading(false)}
        style={{
          objectFit,
          width: '100%',
          height: '100%',
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

export function OptimizedImageGrid({
  images,
  className = '',
}: {
  images: OptimizedImageProps[];
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {images.map((image, i) => (
        <OptimizedImage
          key={i}
          {...image}
          priority={i < 3}
        />
      ))}
    </div>
  );
}
