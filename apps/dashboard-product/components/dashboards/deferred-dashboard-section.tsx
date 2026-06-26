'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DeferredDashboardSectionProps {
  children: ReactNode;
  /** Placeholder height before the section mounts. */
  minHeight?: number;
  fallback?: ReactNode;
}

/** Defers mounting heavy dashboard panels until near the viewport. */
export function DeferredDashboardSection({
  children,
  minHeight = 160,
  fallback = null,
}: DeferredDashboardSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || isVisible) return;

    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={containerRef} style={!isVisible ? { minHeight } : undefined}>
      {isVisible ? children : fallback}
    </div>
  );
}
