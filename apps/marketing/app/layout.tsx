import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Analytics } from '@vercel/analytics/next'
import { locales } from '@/i18n.config'
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: { locale: string }
}>) {
  const { locale } = await params
  
  if (!locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          {children}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
