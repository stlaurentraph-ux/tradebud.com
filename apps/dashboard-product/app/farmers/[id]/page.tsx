'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, FileCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProducerConsentPanel } from '@/components/farmers/producer-consent-panel';
import { listContacts, type ContactRecord } from '@/lib/contact-service';
import { resolveProducerFarmerId } from '@/lib/consent-grants-service';

interface FarmerDetailPageProps {
  params: Promise<{ id: string }>;
}

function deriveFpicSigned(contact: ContactRecord): boolean {
  return contact.consent_status === 'granted';
}

export default function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [farmerProfileId, setFarmerProfileId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listContacts()
      .then(async (contacts) => {
        if (cancelled) return;
        const match = contacts.find((item) => item.id === id && item.contact_type === 'farmer');
        if (!match) {
          setContact(null);
          setLoadError('Producer contact not found in your directory.');
          setFarmerProfileId(null);
          setResolveError(null);
          return;
        }
        setContact(match);
        setLoadError(null);

        if (match.farmer_profile_id) {
          setFarmerProfileId(match.farmer_profile_id);
          setResolveError(null);
          return;
        }

        const resolved = await resolveProducerFarmerId(match.email);
        if (cancelled) return;
        if (resolved) {
          setFarmerProfileId(resolved);
          setResolveError(null);
        } else {
          setFarmerProfileId(null);
          setResolveError(
            'No field-app account linked yet. The producer must sign up with the same email before you can request data access.',
          );
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load producer.');
        setContact(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fpicSigned = useMemo(() => (contact ? deriveFpicSigned(contact) : false), [contact]);
  const verified = contact?.status === 'submitted' || contact?.status === 'engaged';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={contact?.full_name ?? 'Producer'}
        subtitle={contact ? contact.email : `ID: ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Producers', href: '/farmers' },
          { label: contact?.full_name ?? 'Producer' },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/farmers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Producers
          </Link>
        </Button>

        {loadError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading producer…</p>
        ) : contact ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Producer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="mt-1 font-medium">{contact.full_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="mt-1 font-medium">{contact.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="mt-1 font-medium">{contact.phone?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Organisation</div>
                      <div className="mt-1 font-medium">{contact.organization?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Country</div>
                      <div className="mt-1 font-medium">{contact.country?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Directory status</div>
                      <div className="mt-1 font-medium capitalize">{contact.status.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-3 text-xs text-muted-foreground">Verification Status</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={
                          verified
                            ? 'border-green-200 bg-green-500/20 text-green-700'
                            : 'bg-slate-500/20'
                        }
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {verified ? 'Engaged in programme' : 'Pending engagement'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          fpicSigned
                            ? 'border-green-200 bg-green-500/20 text-green-700'
                            : 'border-red-200 bg-red-500/20 text-red-700'
                        }
                      >
                        <FileCheck className="mr-1 h-3 w-3" />
                        {fpicSigned ? 'CRM consent marked granted' : 'CRM consent not granted'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ProducerConsentPanel
                farmerProfileId={farmerProfileId}
                producerName={contact.full_name}
                granteeOrgName={contact.organization}
                resolveError={resolveError}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Field app link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {farmerProfileId ? (
                    <p className="text-muted-foreground">
                      Linked to field-app profile. Data access is governed by producer consent grants below.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Not linked yet. Ask the producer to create a Tracebud field account using{' '}
                      <span className="font-medium text-foreground">{contact.email}</span>.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
