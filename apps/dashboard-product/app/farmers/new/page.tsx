'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { AddContactWizard } from '@/components/contacts/add-contact-wizard';
import { createContact } from '@/lib/contact-service';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBackToProducersLabel,
  getProducerNewBreadcrumbLabel,
  getProducerNewPageSubtitle,
  getProducerNewPageTitle,
  getProducersNavLabel,
} from '@/lib/workflow-terminology-labels';

export default function NewProducerPage() {
  const router = useRouter();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getProducerNewPageTitle(role, t)}
        subtitle={getProducerNewPageSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getProducersNavLabel(role, t), href: '/farmers' },
          { label: getProducerNewBreadcrumbLabel(t) },
        ]}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/farmers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getBackToProducersLabel(role, t)}
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <AddContactWizard
            defaultContactType="farmer"
            lockContactType
            onComplete={async (data) => {
              await createContact({
                full_name: data.full_name,
                email: data.email,
                phone: data.phone || null,
                organization: data.organization || null,
                contact_type: 'farmer',
                country: data.country || null,
                tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
                consent_status: data.consent_status,
              });
              markOnboardingAction('contacts_uploaded');
              toast.success('Producer added to your directory');
              router.push('/farmers');
            }}
            onCancel={() => router.push('/farmers')}
          />
        </div>
      </div>
    </div>
  );
}
