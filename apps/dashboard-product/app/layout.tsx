import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import { OnboardingProvider } from '@/lib/onboarding-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OnboardingWelcomeModal } from '@/components/onboarding/onboarding-welcome-modal';
import { GuidedTourOverlay } from '@/components/onboarding/guided-tour-overlay';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Tracebud Dashboard - EUDR Compliance Platform',
  description: 'Multi-tenant dashboard for managing EUDR compliance, shipment packages, plots, and producers.',
  icons: {
    icon: [
      { url: '/favicon-32x32-v6.png', sizes: '32x32', type: 'image/png' },
      { url: '/tracebud-logo-v6.png', type: 'image/png' },
    ],
    apple: '/favicon-32x32-v6.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <AuthProvider>
          <OnboardingProvider>
            <DashboardLayout>{children}</DashboardLayout>
            <OnboardingWelcomeModal />
            <GuidedTourOverlay />
          </OnboardingProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
