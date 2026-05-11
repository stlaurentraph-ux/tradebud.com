'use client'

import { CookieConsent } from '@/components/cookie-consent'

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  )
}
