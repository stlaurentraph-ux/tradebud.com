import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="h-96 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />

      {/* Content skeletons */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
