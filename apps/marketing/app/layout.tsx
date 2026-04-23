import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tracebud | Trade freely. Trace Easily.',
  description: 'The fastest, safest, cheapest way to move smallholder production into EUDR & ESG markets. De-risk the global supply chain with Tracebud.',
  generator: 'Tracebud',
  icons: {
    icon: [
      { url: '/favicon-16x16-v6.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32-v6.png', sizes: '32x32', type: 'image/png' },
      { url: '/tracebud-logo-v6.png', type: 'image/png' },
    ],
    apple: '/favicon-32x32-v6.png',
    shortcut: '/favicon-32x32-v6.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
