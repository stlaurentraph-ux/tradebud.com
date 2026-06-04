'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useState } from 'react'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('cookie-consent') === 'accepted'
}

/**
 * MarketingAnalytics
 *
 * Loads Google Tag Manager only when:
 *  1. NEXT_PUBLIC_GTM_ID is set in the environment.
 *  2. The visitor has accepted cookie consent (stored by <CookieConsent />).
 *
 * The component polls localStorage once per second for up to 60 s so it
 * activates as soon as the user accepts without requiring a page reload.
 */
export function MarketingAnalytics() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // If already accepted on mount, activate immediately.
    if (hasAnalyticsConsent()) {
      setReady(true)
      return
    }

    // Otherwise poll until acceptance or timeout.
    const interval = setInterval(() => {
      if (hasAnalyticsConsent()) {
        setReady(true)
        clearInterval(interval)
      }
    }, 1000)

    const timeout = setTimeout(() => clearInterval(interval), 60_000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!GTM_ID || !ready) return null

  return (
    <>
      {/* GTM script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
          `.trim(),
        }}
      />
      {/* GTM noscript fallback */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  )
}
