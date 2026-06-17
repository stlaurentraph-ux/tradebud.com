'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { LocaleContext } from '@/lib/locale-context';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddContactWizard } from '@/components/contacts/add-contact-wizard';
import { AddOrganizationWizard } from '@/components/contacts/add-organization-wizard';
import { CsvImportWizard } from '@/components/contacts/csv-import-wizard';
import { createContact, type ContactType } from '@/lib/contact-service';
import { listContactActivityTypesForRole, normalizeContactActivityType } from '@/lib/contact-activity-types';
import {
  getContactsAddBreadcrumbLabel,
  getContactsAddCardCopy,
  getContactsAddImportCta,
  getContactsAddBackToOptionsLabel,
  getContactsAddPageSubtitle,
  getContactsAddPageTitle,
  getContactsAddSectionTitle,
  getContactsAddTipLabel,
  getContactsAddToastMessage,
  getContactsPageTitle,
} from '@/lib/workflow-terminology-labels';
import { toast } from 'sonner';
import {
  User,
  Building2,
  ArrowLeft,
  UserPlus,
  Users,
  Upload,
} from 'lucide-react';

type AddMode = 'select' | 'contact' | 'organization' | 'csv-contacts' | 'csv-organizations';

const MODE_FROM_QUERY: Record<string, AddMode> = {
  contact: 'contact',
  organization: 'organization',
  csv: 'csv-contacts',
  'csv-contacts': 'csv-contacts',
  'csv-organizations': 'csv-organizations',
};

interface ContactDraft {
  full_name: string;
  email: string;
  phone: string;
  contact_type: ContactType;
  organization: string;
  job_title: string;
  country: string;
  region: string;
  address: string;
  tags: string;
  consent_status: 'unknown' | 'granted' | 'revoked';
  notes: string;
}

interface OrganizationDraft {
  name: string;
  org_type: string;
  registration_number: string;
  primary_email: string;
  primary_phone: string;
  website: string;
  size: string;
  commodities: string;
  certifications: string;
  country: string;
  region: string;
  address: string;
  notes: string;
}

interface CsvRow {
  [key: string]: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; field: string; message: string }[];
}

function resolveAddPageMode(mode: AddMode): 'select' | 'contact' | 'organization' | 'csv' {
  if (mode.includes('csv')) return 'csv';
  if (mode === 'contact' || mode === 'organization') return mode;
  return 'select';
}

export default function AddContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const isExporter = user?.active_role === 'exporter';
  const isImporter = user?.active_role === 'importer';
  const role = user?.active_role;
  const [mode, setMode] = useState<AddMode>('select');

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode && MODE_FROM_QUERY[requestedMode]) {
      setMode(MODE_FROM_QUERY[requestedMode]);
    }
  }, [searchParams]);

  const contactWizardDefaults = useMemo(() => {
    if (isCooperative) {
      return {
        defaultContactType: 'farmer' as ContactType,
        lockContactType: true,
        lockedTypeLabel: 'Member',
        activityTypes: listContactActivityTypesForRole('cooperative'),
      };
    }
    if (isImporter) {
      return {
        defaultContactType: 'exporter' as ContactType,
        lockContactType: false,
        lockedTypeLabel: 'Contact',
        activityTypes: listContactActivityTypesForRole('importer'),
      };
    }
    if (isExporter) {
      return {
        defaultContactType: 'cooperative' as ContactType,
        lockContactType: false,
        lockedTypeLabel: 'Supplier',
        activityTypes: listContactActivityTypesForRole('exporter'),
      };
    }
    return {
      defaultContactType: 'farmer' as ContactType,
      lockContactType: false,
      lockedTypeLabel: 'Producer',
      activityTypes: listContactActivityTypesForRole('other'),
    };
  }, [isCooperative, isImporter, isExporter]);

  const pageMode = resolveAddPageMode(mode);

  const handleContactComplete = async (data: ContactDraft) => {
    await createContact({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      organization: data.organization || null,
      contact_type: data.contact_type,
      country: data.country || null,
      tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
      consent_status: data.consent_status,
    });
    markOnboardingAction('contacts_uploaded');
    toast.success(
      getContactsAddToastMessage(isCooperative ? 'member_added' : 'contact_created', undefined, t),
    );
    router.push('/contacts');
  };

  const handleOrganizationComplete = async (data: OrganizationDraft) => {
    await createContact({
      full_name: data.name,
      email: data.primary_email || `${data.name.toLowerCase().replace(/\s/g, '-')}@organization.local`,
      phone: data.primary_phone || null,
      organization: data.name,
      contact_type: 'other',
      country: data.country || null,
      tags: data.commodities ? data.commodities.split(',').map((tag) => tag.trim()) : [],
      consent_status: 'unknown',
    });
    markOnboardingAction('contacts_uploaded');
    toast.success(getContactsAddToastMessage('organization_created', undefined, t));
    router.push('/contacts');
  };

  const handleCsvImport = async (data: CsvRow[]): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: { row: number; field: string; message: string }[] = [];

    const parseTags = (raw: string | undefined) =>
      raw ? raw.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean) : [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        await createContact({
          full_name: row.full_name || row.name || '',
          email: row.email || row.primary_email || '',
          phone: row.phone || row.primary_phone || null,
          organization: row.organization || row.name || null,
          contact_type: normalizeContactActivityType(row.contact_type || row.activity_type),
          country: row.country || null,
          tags: parseTags(row.tags),
          consent_status: (row.consent_status as 'unknown' | 'granted' | 'revoked') || 'unknown',
        });
        success++;
      } catch (err) {
        failed++;
        errors.push({
          row: i + 1,
          field: 'general',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (success > 0) {
      markOnboardingAction('contacts_uploaded');
      toast.success(getContactsAddToastMessage('import_success', { count: success }, t));
    }

    if (failed > 0) {
      toast.error(getContactsAddToastMessage('import_partial', { success, failed }, t));
    }

    return { success, failed, errors };
  };

  const handleCsvFinished = () => {
    router.push('/contacts');
  };

  const handleCancel = () => {
    if (mode === 'select') {
      router.push('/contacts');
    } else {
      setMode('select');
    }
  };

  const breadcrumbs = [
    { label: getContactsPageTitle(role ?? isCooperative, t), href: '/contacts' },
    {
      label:
        pageMode === 'select'
          ? getContactsAddBreadcrumbLabel('add', isCooperative, t)
          : pageMode === 'csv'
            ? getContactsAddBreadcrumbLabel('bulk', isCooperative, t)
            : pageMode === 'contact'
              ? getContactsAddBreadcrumbLabel('add_contact', isCooperative, t)
              : getContactsAddBreadcrumbLabel('add_organization', isCooperative, t),
    },
  ];

  return (
    <>
      <AppHeader
        title={getContactsAddPageTitle(pageMode, isCooperative, t)}
        subtitle={getContactsAddPageSubtitle(isCooperative, t)}
        breadcrumbs={breadcrumbs}
        actions={
          mode !== 'select' && (
            <Button variant="ghost" size="sm" onClick={() => setMode('select')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getContactsAddBackToOptionsLabel(t)}
            </Button>
          )
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          {mode === 'select' && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-lg font-semibold">
                  {getContactsAddSectionTitle('individual', t)}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => setMode('contact')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {getContactsAddCardCopy('contact', 'title', isCooperative, t)}
                          </CardTitle>
                          <CardDescription>
                            {getContactsAddCardCopy('contact', 'subtitle', isCooperative, t)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {getContactsAddCardCopy('contact', 'description', isCooperative, t)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => setMode('organization')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {getContactsAddCardCopy('organization', 'title', isCooperative, t)}
                          </CardTitle>
                          <CardDescription>
                            {getContactsAddCardCopy('organization', 'subtitle', isCooperative, t)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {getContactsAddCardCopy('organization', 'description', isCooperative, t)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold">
                  {getContactsAddSectionTitle('bulk', t)}
                </h2>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/80 text-accent-foreground">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {getContactsAddCardCopy('csv', 'title', isCooperative, t)}
                        </CardTitle>
                        <CardDescription>
                          {getContactsAddCardCopy('csv', 'subtitle', isCooperative, t)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {getContactsAddCardCopy('csv', 'description', isCooperative, t)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => setMode('csv-contacts')}>
                        <User className="mr-2 h-4 w-4" />
                        {getContactsAddImportCta('contacts', t)}
                      </Button>
                      <Button variant="outline" onClick={() => setMode('csv-organizations')}>
                        <Users className="mr-2 h-4 w-4" />
                        {getContactsAddImportCta('organizations', t)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {getContactsAddSectionTitle('tips', t)}
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {([1, 2, 3, 4] as const).map((tip) => (
                    <li key={tip}>{getContactsAddTipLabel(tip, isCooperative, t)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {mode === 'contact' && (
            <AddContactWizard
              onComplete={handleContactComplete}
              onCancel={handleCancel}
              defaultContactType={contactWizardDefaults.defaultContactType}
              lockContactType={contactWizardDefaults.lockContactType}
              lockedTypeLabel={contactWizardDefaults.lockedTypeLabel}
              isCooperative={isCooperative}
              activityTypes={contactWizardDefaults.activityTypes}
            />
          )}

          {mode === 'organization' && (
            <AddOrganizationWizard onComplete={handleOrganizationComplete} onCancel={handleCancel} />
          )}

          {mode === 'csv-contacts' && (
            <CsvImportWizard
              importType="contacts"
              onComplete={handleCsvImport}
              onCancel={handleCancel}
              onFinished={handleCsvFinished}
            />
          )}

          {mode === 'csv-organizations' && (
            <CsvImportWizard
              importType="organizations"
              onComplete={handleCsvImport}
              onCancel={handleCancel}
              onFinished={handleCsvFinished}
            />
          )}
        </div>
      </div>
    </>
  );
}
