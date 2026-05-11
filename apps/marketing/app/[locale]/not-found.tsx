'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFound() {
  const t = useTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--forest-light)]">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-[var(--data-emerald)] mb-4">404</div>
          <h1 className="text-4xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-white/70 text-lg mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/">
            <Button className="w-full bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold py-6 text-lg rounded-full">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/thank-you">
            <Button
              variant="outline"
              className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-6 text-lg rounded-full"
            >
              View Waitlist
              <ArrowRight className="w-5 h-5 ml-2" />
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
