import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { DemoBanner } from './demo-banner';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Cooperative Console — Tracebud',
  description:
    'Coordinate member plots, aggregate due diligence, and hand off traceable batches to exporters with EUDR-ready evidence (demo).',
  icons: {
    icon: '/images/tracebud-logo.png',
    shortcut: '/images/tracebud-logo.png',
    apple: '/images/tracebud-logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#14532d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
