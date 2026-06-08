import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CookieConsent } from '@/components/cookie-consent';
import { FloatingMobileCTA } from '@/components/floating-mobile-cta';
import { MarketingAnalytics } from '@/components/marketing-analytics';
import { WaitlistDialogProvider } from '@/components/waitlist-dialog';
import { routing } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <WaitlistDialogProvider>
        {children}
        <FloatingMobileCTA />
        <CookieConsent />
        <MarketingAnalytics />
      </WaitlistDialogProvider>
    </NextIntlClientProvider>
  );
}
