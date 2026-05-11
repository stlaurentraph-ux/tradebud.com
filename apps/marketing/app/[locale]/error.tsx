'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Silent error handling - errors are logged by error boundary
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--forest-light)]">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-red-500/20 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-white/70 text-lg mb-8">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {error.digest && (
          <p className="text-white/50 text-sm mb-8 font-mono bg-white/5 p-3 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={reset}
            className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-6 text-lg rounded-full"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-6 text-lg rounded-full"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/60 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@tracebud.com" className="text-[var(--data-emerald)] font-semibold hover:underline">
              support@tracebud.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
