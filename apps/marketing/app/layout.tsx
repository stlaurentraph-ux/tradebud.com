import type { Metadata, Viewport } from 'next'
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
  keywords: ['EUDR', 'traceability', 'supply chain', 'compliance', 'deforestation', 'coffee', 'cocoa', 'palm oil', 'sustainability', 'ESG'],
  authors: [{ name: 'Tracebud' }],
  creator: 'Tracebud',
  publisher: 'Tracebud',
  metadataBase: new URL('https://tracebud.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'es': '/es',
      'pt': '/pt',
      'fr': '/fr',
      'de': '/de',
      'nl': '/nl',
      'it': '/it',
      'id': '/id',
      'vi': '/vi',
      'am': '/am',
      'no': '/no',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tracebud.com',
    siteName: 'Tracebud',
    title: 'Tracebud | Trade freely. Trace Easily.',
    description: 'The fastest, safest, cheapest way to move smallholder production into EUDR & ESG markets.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tracebud - Supply Chain Traceability Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tracebud | Trade freely. Trace Easily.',
    description: 'The fastest, safest, cheapest way to move smallholder production into EUDR & ESG markets.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#064E3B',
}

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Tracebud',
  url: 'https://tracebud.com',
  logo: 'https://tracebud.com/tracebud-logo-v6.png',
  description: 'The fastest, safest, cheapest way to move smallholder production into EUDR & ESG markets.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@tracebud.com',
    contactType: 'customer service',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When will Tracebud launch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tracebud is in active pilot testing. We are enrolling select partners now. Join the waitlist to be notified when we go live.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Tracebud cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pricing is transparent and scales with your operation size. Free trial available. Details shared during onboarding.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does setup take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most cooperatives are mapped and operational within 48 hours of signing up. Offline-first design means zero downtime.',
      },
    },
  ],
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
