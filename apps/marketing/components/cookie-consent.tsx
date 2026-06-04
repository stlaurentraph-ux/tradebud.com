'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'
import { notifyAnalyticsConsentChanged } from '@/lib/marketing-analytics'

function readCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem('cookie-consent'))
}

export function CookieConsent() {
  const [accepted, setAccepted] = useState(readCookieConsent)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (accepted) return
    const timer = setTimeout(() => setShowBanner(true), 1000)
    return () => clearTimeout(timer)
  }, [accepted])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setAccepted(true)
    setShowBanner(false)
    notifyAnalyticsConsentChanged()
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setAccepted(true)
    setShowBanner(false)
    notifyAnalyticsConsentChanged()
  }

  return (
    <AnimatePresence>
      {showBanner && !accepted && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Cookie className="w-6 h-6 text-[var(--data-emerald)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookie Consent</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We use cookies to analyze website traffic and optimize your experience. By clicking &quot;Accept&quot;, you consent to our use of cookies. You can review our{' '}
                    <Link href="/privacy" className="text-[var(--data-emerald)] hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-[var(--data-emerald)] hover:underline font-medium">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <button
                onClick={handleReject}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={handleReject}
                className="text-sm border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Reject
              </Button>
              <Button
                onClick={handleAccept}
                className="text-sm bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold"
              >
                Accept Cookies
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
