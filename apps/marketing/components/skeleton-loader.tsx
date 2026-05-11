'use client';

export function SkeletonLoader({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-full animate-pulse"
          style={{
            animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
            width: i === lines - 1 ? '85%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-8 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg w-3/4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-full animate-pulse" />
          <div className="h-4 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-full animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ 
  columns = 3, 
  count = 6, 
  className = '' 
}: { 
  columns?: number; 
  count?: number; 
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="space-y-8 py-20">
      <div className="space-y-4">
        <div className="h-16 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg w-3/4 animate-pulse" />
        <div className="h-8 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg w-full animate-pulse" />
      </div>
      <div className="h-12 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg w-48 animate-pulse" />
    </div>
  );
}
