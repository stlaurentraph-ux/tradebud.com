'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddContactWizard } from '@/components/contacts/add-contact-wizard';
import { AddOrganizationWizard } from '@/components/contacts/add-organization-wizard';
import { CsvImportWizard } from '@/components/contacts/csv-import-wizard';
import { createContact, type ContactType } from '@/lib/contact-service';
import { toast } from 'sonner';
import {
  User,
  Building2,
  FileSpreadsheet,
  ArrowLeft,
  UserPlus,
  Users,
  Upload,
} from 'lucide-react';

type AddMode = 'select' | 'contact' | 'organization' | 'csv-contacts' | 'csv-organizations';

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

export default function AddContactPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AddMode>('select');
  const [importTab, setImportTab] = useState<'contacts' | 'organizations'>('contacts');

  const handleContactComplete = async (data: ContactDraft) => {
    await createContact({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      organization: data.organization || null,
      contact_type: data.contact_type,
      country: data.country || null,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : [],
      consent_status: data.consent_status,
    });
    toast.success('Contact created successfully');
    router.push('/contacts');
  };

  const handleOrganizationComplete = async (data: OrganizationDraft) => {
    // For now, create as a contact with organization type
    // In a real app, you'd have a separate organization service
    await createContact({
      full_name: data.name,
      email: data.primary_email || `${data.name.toLowerCase().replace(/\s/g, '-')}@organization.local`,
      phone: data.primary_phone || null,
      organization: data.name,
      contact_type: 'other',
      country: data.country || null,
      tags: data.commodities ? data.commodities.split(',').map((t) => t.trim()) : [],
      consent_status: 'unknown',
    });
    toast.success('Organization created successfully');
    router.push('/contacts');
  };

  const handleCsvImport = async (data: CsvRow[]): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: { row: number; field: string; message: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        await createContact({
          full_name: row.full_name || row.name || '',
          email: row.email || row.primary_email || '',
          phone: row.phone || row.primary_phone || null,
          organization: row.organization || row.name || null,
          contact_type: (row.contact_type as ContactType) || 'other',
          country: row.country || null,
          tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
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
      toast.success(`Successfully imported ${success} record${success !== 1 ? 's' : ''}`);
    }

    return { success, failed, errors };
  };

  const handleCancel = () => {
    if (mode === 'select') {
      router.push('/contacts');
    } else {
      setMode('select');
    }
  };

  const breadcrumbs = [
    { label: 'Contacts', href: '/contacts' },
    { label: mode === 'select' ? 'Add' : mode.includes('csv') ? 'Bulk Import' : mode === 'contact' ? 'Add Contact' : 'Add Organization' },
  ];

  return (
    <>
      <AppHeader
        title={
          mode === 'select'
            ? 'Add Contact or Organization'
            : mode.includes('csv')
              ? 'Bulk Import'
              : mode === 'contact'
                ? 'Add New Contact'
                : 'Add New Organization'
        }
        subtitle="Tenant CRM"
        breadcrumbs={breadcrumbs}
        actions={
          mode !== 'select' && (
            <Button variant="ghost" size="sm" onClick={() => setMode('select')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to options
            </Button>
          )
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          {mode === 'select' && (
            <div className="space-y-6">
              {/* Individual Add Options */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Add Individually</h2>
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
                          <CardTitle className="text-base">Add Contact</CardTitle>
                          <CardDescription>Add an individual person</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Create a new contact with personal details, organization affiliation, and
                        location information.
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
                          <CardTitle className="text-base">Add Organization</CardTitle>
                          <CardDescription>Add a company or cooperative</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Create a new organization with business details, certifications, and
                        commodity information.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Bulk Import Options */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Bulk Import</h2>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/80 text-accent-foreground">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Import from CSV</CardTitle>
                        <CardDescription>Upload a CSV file with multiple records</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Import multiple contacts or organizations at once using a CSV file. You can
                      map columns and preview data before importing.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => setMode('csv-contacts')}>
                        <User className="mr-2 h-4 w-4" />
                        Import Contacts
                      </Button>
                      <Button variant="outline" onClick={() => setMode('csv-organizations')}>
                        <Users className="mr-2 h-4 w-4" />
                        Import Organizations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Tips</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    Use <strong>Add Contact</strong> for individual people like farmers, managers,
                    or representatives
                  </li>
                  <li>
                    Use <strong>Add Organization</strong> for cooperatives, exporters, or other
                    business entities
                  </li>
                  <li>
                    Use <strong>CSV Import</strong> when you have many records to add at once
                  </li>
                  <li>You can download a template CSV to ensure your data is formatted correctly</li>
                </ul>
              </div>
            </div>
          )}

          {mode === 'contact' && (
            <AddContactWizard onComplete={handleContactComplete} onCancel={handleCancel} />
          )}

          {mode === 'organization' && (
            <AddOrganizationWizard onComplete={handleOrganizationComplete} onCancel={handleCancel} />
          )}

          {mode === 'csv-contacts' && (
            <CsvImportWizard
              importType="contacts"
              onComplete={handleCsvImport}
              onCancel={handleCancel}
            />
          )}

          {mode === 'csv-organizations' && (
            <CsvImportWizard
              importType="organizations"
              onComplete={handleCsvImport}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </>
  );
}
