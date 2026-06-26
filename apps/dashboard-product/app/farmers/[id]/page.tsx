'use client';

import { use, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, FileCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProducerConsentPanel } from '@/components/farmers/producer-consent-panel';
import { listContacts, type ContactRecord } from '@/lib/contact-service';
import { resolveProducerFarmerId } from '@/lib/consent-grants-service';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBackToProducersLabel,
  getContactDetailHref,
  getProducerDetailFallbackTitle,
  getProducerLoadingMessage,
  getProducerNotFoundMessage,
  getProducersNavHref,
  getProducersNavLabel,
  getContactStatusLabel,
  getProducerDetailCopy,
} from '@/lib/workflow-terminology-labels';

interface FarmerDetailPageProps {
  params: Promise<{ id: string }>;
}

function deriveFpicSigned(contact: ContactRecord): boolean {
  return contact.consent_status === 'granted';
}

export default function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.active_role;
  const { id } = use(params);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [farmerProfileId, setFarmerProfileId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    setLoading(true);
    void listContacts()
      .then(async (contacts) => {
        if (cancelled) return;
        const match = contacts.find((item) => item.id === id);
        if (!match) {
          setContact(null);
          setLoadError(getProducerNotFoundMessage(role, t));
          setFarmerProfileId(null);
          setResolveError(null);
          return;
        }
        if (match.contact_type !== 'farmer') {
          router.replace(getContactDetailHref(id));
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
          setResolveError(getProducerDetailCopy('resolve_error_no_account', role, t));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : getProducerDetailCopy('load_error', role, t));
        setContact(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, role, router, t]);

  const fpicSigned = useMemo(() => (contact ? deriveFpicSigned(contact) : false), [contact]);
  const verified = contact?.status === 'submitted' || contact?.status === 'engaged';
  const producersHref = getProducersNavHref(role);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={contact?.full_name ?? getProducerDetailFallbackTitle(role, t)}
        subtitle={contact ? contact.email : `ID: ${id}`}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getProducersNavLabel(role, t), href: producersHref },
          { label: contact?.full_name ?? getProducerDetailFallbackTitle(role, t) },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={producersHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getBackToProducersLabel(role, t)}
          </Link>
        </Button>

        {loadError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">{getProducerLoadingMessage(role, t)}</p>
        ) : contact ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{getProducerDetailCopy('section_info', role, t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">{getProducerDetailCopy('field_name', role, t)}</div>
                      <div className="mt-1 font-medium">{contact.full_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{getProducerDetailCopy('field_email', role, t)}</div>
                      <div className="mt-1 font-medium">{contact.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{getProducerDetailCopy('field_phone', role, t)}</div>
                      <div className="mt-1 font-medium">{contact.phone?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {getProducerDetailCopy('field_organisation', role, t)}
                      </div>
                      <div className="mt-1 font-medium">{contact.organization?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{getProducerDetailCopy('field_country', role, t)}</div>
                      <div className="mt-1 font-medium">{contact.country?.trim() || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {getProducerDetailCopy('field_directory_status', role, t)}
                      </div>
                      <div className="mt-1 font-medium">{getContactStatusLabel(contact.status, t)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-3 text-xs text-muted-foreground">
                      {getProducerDetailCopy('section_verification', role, t)}
                    </div>
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
                        {verified
                          ? getProducerDetailCopy('badge_engaged', role, t)
                          : getProducerDetailCopy('badge_pending_engagement', role, t)}
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
                        {fpicSigned
                          ? getProducerDetailCopy('badge_consent_granted', role, t)
                          : getProducerDetailCopy('badge_consent_not_granted', role, t)}
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
                  <CardTitle className="text-sm">{getProducerDetailCopy('section_field_app', role, t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {farmerProfileId ? (
                    <p className="text-muted-foreground">
                      {getProducerDetailCopy('field_app_linked', role, t)}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {getProducerDetailCopy('field_app_not_linked', role, t, { email: contact.email })}
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
