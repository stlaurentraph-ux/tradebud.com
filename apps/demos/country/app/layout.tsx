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
  title: 'National Registry Console — Tracebud',
  description:
    'Sovereign oversight of producer registries, EUDR-aligned submissions, and interoperability with national cadastre and EU systems (demo).',
  icons: {
    icon: [
      { url: '/favicon-16x16-v6.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32-v6.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32-v6.png',
    apple: '/favicon-32x32-v6.png',
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
