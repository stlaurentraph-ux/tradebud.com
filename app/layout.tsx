import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Tracebud — EUDR Compliance for Smallholder Coffee Supply Chains',
  description: 'Tracebud helps cooperatives, exporters, and buyers collect farm-level proof offline, request missing data upstream, and prepare buyer-ready EUDR workflows.',
}

export const viewport: Viewport = {
  themeColor: '#0d1510',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
