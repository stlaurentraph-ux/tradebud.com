import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Tracebud Field App',
  description: 'Sign-in and email confirmation for the Tracebud field app.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
