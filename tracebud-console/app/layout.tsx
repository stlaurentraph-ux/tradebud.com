import type { ReactNode } from 'react';

export const metadata = {
  title: 'Tracebud Console',
  description: 'Dashboard for exporters and importers using Tracebud.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

