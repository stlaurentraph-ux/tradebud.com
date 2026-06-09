'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { hasAnalyticsConsent } from '@/lib/marketing-analytics';

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function MarketingAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());

    const sync = () => setConsented(hasAnalyticsConsent());
    window.addEventListener('cookie-consent-changed', sync);
    return () => window.removeEventListener('cookie-consent-changed', sync);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Analytics />
      {gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="tracebud-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
