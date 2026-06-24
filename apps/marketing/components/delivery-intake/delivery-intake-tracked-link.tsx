'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type DeliveryIntakeCta = 'claim' | 'signup' | 'login';

type DeliveryIntakeTrackedLinkProps = ComponentProps<typeof Link> & {
  cta: DeliveryIntakeCta;
  intakeKind: 'delivery' | 'trip';
  refCode: string;
};

export function DeliveryIntakeTrackedLink({
  cta,
  intakeKind,
  refCode,
  onClick,
  ...props
}: DeliveryIntakeTrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackMarketingEvent('marketing_cta_clicked', {
          cta,
          intakeKind,
          refCode,
          surface: 'delivery_intake_preview',
        });
        onClick?.(event);
      }}
    />
  );
}
