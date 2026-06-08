import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tracebud | Traceability infrastructure for the whole chain',
  description:
    'Capture origin data once, preserve provenance, and generate EUDR-ready compliance records. Built for farmers, cooperatives, exporters, and buyers.',
  generator: 'Tracebud',
  keywords: [
    'EUDR',
    'traceability',
    'supply chain',
    'compliance',
    'deforestation',
    'coffee',
    'cocoa',
    'palm oil',
    'sustainability',
    'ESG',
  ],
  authors: [{ name: 'Tracebud' }],
  creator: 'Tracebud',
  publisher: 'Tracebud',
  metadataBase: new URL('https://tracebud.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tracebud',
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      es: '/es',
      pt: '/pt',
      fr: '/fr',
      de: '/de',
      nl: '/nl',
      it: '/it',
      id: '/id',
      vi: '/vi',
      am: '/am',
      no: '/no',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tracebud.com',
    siteName: 'Tracebud',
    title: 'Tracebud | Traceability infrastructure for the whole chain',
    description:
      'Capture origin data once, preserve provenance, and generate EUDR-ready compliance records for fragmented supply chains.',
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
    title: 'Tracebud | Traceability infrastructure for the whole chain',
    description:
      'Capture origin data once, preserve provenance, and generate EUDR-ready compliance records.',
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#064E3B',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Tracebud',
  url: 'https://tracebud.com',
  logo: 'https://tracebud.com/tracebud-logo-v6.png',
  description:
    'Capture origin data once, preserve provenance, and generate EUDR-ready compliance records for fragmented supply chains.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@tracebud.com',
    contactType: 'customer service',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When can I start using Tracebud?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tracebud is opening in phases by region and commodity. Join the waitlist and we will email you when your use case is supported.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does it cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free for producers. Cooperatives, exporters, and buyers pay based on network size and usage. Visit the pricing page or join the waitlist for details.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does setup take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Producers can start mapping with the offline app right away. Most cooperatives upload their network and send the first request within a week.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
