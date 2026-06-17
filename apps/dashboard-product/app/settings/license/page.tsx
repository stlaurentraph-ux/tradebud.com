'use client';

import { AppHeader } from '@/components/layout/app-header';
import { BillingUsagePanel } from '@/components/settings/billing-usage-panel';
import { useLocale } from '@/lib/locale-context';
import { getSettingsLicensePageCopy } from '@/lib/workflow-terminology-labels';

export default function SettingsLicensePage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getSettingsLicensePageCopy('title', t)}
        description={getSettingsLicensePageCopy('description', t)}
        breadcrumbs={[
          { label: t('settings.title'), href: '/settings' },
          { label: getSettingsLicensePageCopy('breadcrumb', t) },
        ]}
      />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <BillingUsagePanel />
        </div>
      </main>
    </div>
  );
}
