import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Exporter Dashboard - TradeBud',
  description: 'Exporter dashboard for managing DDS packages and compliance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
