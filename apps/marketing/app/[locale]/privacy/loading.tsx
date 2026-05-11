import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header skeleton */}
        <div className="mb-12 space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
