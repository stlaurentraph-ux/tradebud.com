import type { ReactNode } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Mail, MessageCircle, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support | Tracebud',
  description:
    'Get help with the Tracebud mobile field app, account access, plot mapping, and data backup.',
};

type Props = {
  params: Promise<{ locale: string }>;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">{children}</div>
    </section>
  );
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--forest-light)] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${locale}`}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">Support</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Help for the Tracebud mobile field app. The app is free for everyone — farmers,
            cooperatives, and other Tracebud users. No subscription or in-app purchase is required in
            the app.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none space-y-10">
          <Section title="Contact us">
            <p>
              Email{' '}
              <a
                href="mailto:support@tracebud.com"
                className="text-[var(--data-emerald)] font-semibold hover:underline"
              >
                support@tracebud.com
              </a>{' '}
              with your device type (iPhone, iPad, or Android), app version, and a short description
              of the issue. We typically reply within one business day.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 not-prose mt-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Mail className="w-6 h-6 text-[var(--data-emerald)] mb-3" />
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground mt-1">support@tracebud.com</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <Smartphone className="w-6 h-6 text-[var(--data-emerald)] mb-3" />
                <p className="font-semibold text-foreground">Field app</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Plot mapping, harvests, and land papers
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <MessageCircle className="w-6 h-6 text-[var(--data-emerald)] mb-3" />
                <p className="font-semibold text-foreground">Cooperative help</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask your cooperative for an invite or account reset
                </p>
              </div>
            </div>
          </Section>

          <Section title="Mobile field app">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Sign in:</strong> Use Google, Apple, or email with any Tracebud account —
                including farmers, cooperative staff, and other users who also use{' '}
                <a
                  href="https://dashboard.tracebud.com"
                  className="text-[var(--data-emerald)] font-semibold hover:underline"
                >
                  dashboard.tracebud.com
                </a>
                .
              </li>
              <li>
                <strong>Offline mapping:</strong> You can map plots without an account. Sign in later
                from Settings to back up to the cloud.
              </li>
              <li>
                <strong>Backup &amp; sync:</strong> Requires internet and a signed-in account.
              </li>
              <li>
                <strong>Privacy:</strong> See our{' '}
                <Link
                  href={`/${locale}/privacy`}
                  className="text-[var(--data-emerald)] font-semibold hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </li>
            </ul>
          </Section>

          <Section title="Organization dashboard (paid)">
            <p>
              Tracebud workspace subscriptions for cooperatives, exporters, and importers are purchased
              on our website and used at{' '}
              <a
                href="https://dashboard.tracebud.com"
                className="text-[var(--data-emerald)] font-semibold hover:underline"
              >
                dashboard.tracebud.com
              </a>
              . Those subscriptions are separate from the free mobile field app. For billing, trials, or
              dashboard access, contact{' '}
              <a
                href="mailto:support@tracebud.com"
                className="text-[var(--data-emerald)] font-semibold hover:underline"
              >
                support@tracebud.com
              </a>{' '}
              or visit{' '}
              <Link
                href={`/${locale}/pricing`}
                className="text-[var(--data-emerald)] font-semibold hover:underline"
              >
                pricing
              </Link>
              .
            </p>
          </Section>

          <Section title="Report a problem">
            <p>When reporting a crash or bug, please include:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Device model and OS version</li>
              <li>App version (Settings → About in the field app)</li>
              <li>Steps to reproduce</li>
              <li>Screenshots if possible</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
