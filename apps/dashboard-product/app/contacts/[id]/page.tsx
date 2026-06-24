'use client';

import { use, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, FileCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProducerConsentPanel } from '@/components/farmers/producer-consent-panel';
import { ContactStatusPipeline } from '@/components/contacts/contact-status-pipeline';
import { EditContactForm, type ContactEditDraft } from '@/components/contacts/edit-contact-form';
import { listContactActivityTypesForRole, resolveContactDirectoryRole } from '@/lib/contact-activity-types';
import { buildAddColleagueHref, buildOrganizationHref, listOrganizationColleagues } from '@/lib/contact-directory';
import {
  deleteContact,
  listContacts,
  updateContact,
  updateContactStatus,
  type ContactRecord,
  type ContactStatus,
} from '@/lib/contact-service';
import { DASHBOARD_CONTACT_STATUSES } from '@/lib/dashboardCrmOutreachRegistry';
import { resolveProducerFarmerId } from '@/lib/consent-grants-service';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBackToContactsLabel,
  getContactActivityDisplayLabel,
  getContactColleaguesCopy,
  getContactConsentLabel,
  getContactDetailActionLabel,
  getContactDetailHref,
  getContactNotFoundMessage,
  getContactStatusLabel,
  getContactsPageTitle,
  getProducerDetailCopy,
  getProducerDetailFallbackTitle,
  getProducerLoadingMessage,
  getProducersNavHref,
} from '@/lib/workflow-terminology-labels';

const CONTACT_STATUSES: ContactStatus[] = [...DASHBOARD_CONTACT_STATUSES];

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

function deriveFpicSigned(contact: ContactRecord): boolean {
  return contact.consent_status === 'granted';
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.active_role;
  const isCooperative = role === 'cooperative';
  const isExporter = role === 'exporter';
  const audience = role ?? isCooperative;
  const { id } = use(params);
  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [allContacts, setAllContacts] = useState<ContactRecord[]>([]);
  const [farmerProfileId, setFarmerProfileId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const contactDirectoryRole = resolveContactDirectoryRole(role);

  const activityTypes = useMemo(
    () => listContactActivityTypesForRole(contactDirectoryRole),
    [contactDirectoryRole],
  );

  const loadContact = async () => {
    setLoading(true);
    try {
      const contacts = await listContacts();
      setAllContacts(contacts);
      const match = contacts.find((item) => item.id === id);
      if (!match) {
        setContact(null);
        setLoadError(getContactNotFoundMessage(role, t));
        setFarmerProfileId(null);
        setResolveError(null);
        return;
      }

      if (match.contact_type === 'farmer' && role !== 'exporter' && role !== 'importer') {
        router.replace(`/farmers/${encodeURIComponent(id)}`);
        return;
      }

      setContact(match);
      setLoadError(null);

      if (match.contact_type !== 'farmer') {
        setFarmerProfileId(null);
        setResolveError(null);
        return;
      }

      if (match.farmer_profile_id) {
        setFarmerProfileId(match.farmer_profile_id);
        setResolveError(null);
        return;
      }

      const resolved = await resolveProducerFarmerId(match.email);
      if (resolved) {
        setFarmerProfileId(resolved);
        setResolveError(null);
      } else {
        setFarmerProfileId(null);
        setResolveError(getProducerDetailCopy('resolve_error_no_account', role, t));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : getProducerDetailCopy('load_error', role, t));
      setContact(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
  }, [id]);

  const colleagues = useMemo(
    () => (contact ? listOrganizationColleagues(allContacts, contact) : []),
    [allContacts, contact],
  );

  const fpicSigned = useMemo(() => (contact ? deriveFpicSigned(contact) : false), [contact]);
  const verified = contact?.status === 'submitted' || contact?.status === 'engaged';
  const contactsHref = getProducersNavHref(role);
  const isFarmerSupplier = contact?.contact_type === 'farmer';

  const handleStatusChange = async (status: ContactStatus) => {
    if (!contact) return;
    try {
      setStatusError(null);
      const updated = await updateContactStatus(contact.id, status);
      setContact(updated);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to update status.');
    }
  };

  const handleSaveEdit = async (draft: ContactEditDraft) => {
    if (!contact) return;
    const updated = await updateContact(contact.id, {
      full_name: draft.full_name,
      email: draft.email,
      phone: draft.phone || null,
      organization: draft.organization || null,
      contact_type: draft.contact_type,
      processing_subtype: draft.processing_subtype,
      country: draft.country || null,
      tags: draft.tags ? draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      consent_status: draft.consent_status,
    });
    setContact(updated);
    setAllContacts((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    setIsEditing(false);
    toast.success('Contact updated.');
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!window.confirm(getContactDetailActionLabel('confirm_delete', t))) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteContact(contact.id);
      toast.success('Contact removed from directory.');
      router.push(contactsHref);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove contact.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={contact?.full_name ?? getProducerDetailFallbackTitle(role, t)}
        subtitle={contact ? contact.email : `ID: ${id}`}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getContactsPageTitle(audience, t), href: contactsHref },
          { label: contact?.full_name ?? getProducerDetailFallbackTitle(role, t) },
        ]}
        actions={
          contact ? (
            <PermissionGate permission="contacts:edit">
              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    {getContactDetailActionLabel('edit', t)}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  {getContactDetailActionLabel('delete', t)}
                </Button>
              </div>
            </PermissionGate>
          ) : null
        }
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href={contactsHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getBackToContactsLabel(role, t)}
          </Link>
        </Button>

        {loadError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {statusError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{statusError}</AlertDescription>
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
                  {isEditing ? (
                    <EditContactForm
                      contact={contact}
                      role={contactDirectoryRole}
                      activityTypes={activityTypes}
                      onSave={handleSaveEdit}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_name', role, t)}
                          </div>
                          <div className="mt-1 font-medium">{contact.full_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_email', role, t)}
                          </div>
                          <div className="mt-1 font-medium">{contact.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_phone', role, t)}
                          </div>
                          <div className="mt-1 font-medium">{contact.phone?.trim() || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_organisation', role, t)}
                          </div>
                          <div className="mt-1 font-medium">
                            {contact.organization?.trim() ? (
                              isExporter || role === 'importer' ? (
                                <Link
                                  href={buildOrganizationHref(contact.organization.trim())}
                                  className="text-foreground hover:text-primary hover:underline"
                                >
                                  {contact.organization.trim()}
                                </Link>
                              ) : (
                                contact.organization.trim()
                              )
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_country', role, t)}
                          </div>
                          <div className="mt-1 font-medium">{contact.country?.trim() || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_activity', role, t)}
                          </div>
                          <div className="mt-1 font-medium">
                            {getContactActivityDisplayLabel(
                              {
                                contact_type: contact.contact_type,
                                processing_subtype: contact.processing_subtype,
                              },
                              t,
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_directory_status', role, t)}
                          </div>
                          <div className="mt-2">
                            <ContactStatusPipeline status={contact.status} t={t} variant="full" />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground">
                            {getProducerDetailCopy('field_tags', role, t)}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {contact.tags.length > 0 ? (
                              contact.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isFarmerSupplier ? (
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
                      ) : (
                        <div className="border-t pt-4">
                          <div className="text-xs text-muted-foreground">Consent</div>
                          <div className="mt-1 font-medium">
                            {getContactConsentLabel(contact.consent_status, t)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {contact.organization?.trim() ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">{getContactColleaguesCopy('title', t)}</CardTitle>
                    <PermissionGate permission="contacts:create">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={buildAddColleagueHref(contact)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {getContactDetailActionLabel('add_colleague', t)}
                        </Link>
                      </Button>
                    </PermissionGate>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{getContactColleaguesCopy('description', t)}</p>
                    {colleagues.length === 0 ? (
                      <p className="text-muted-foreground">{getContactColleaguesCopy('empty', t)}</p>
                    ) : (
                      <ul className="divide-y rounded-md border">
                        {colleagues.map((colleague) => (
                          <li key={colleague.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <Link
                                href={getContactDetailHref(colleague.id)}
                                className="font-medium hover:text-primary hover:underline"
                              >
                                {colleague.full_name}
                              </Link>
                              <p className="text-xs text-muted-foreground">{colleague.email}</p>
                            </div>
                            <Badge variant="outline">{getContactStatusLabel(colleague.status, t)}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {isFarmerSupplier && !isEditing ? (
                <ProducerConsentPanel
                  farmerProfileId={farmerProfileId}
                  producerName={contact.full_name}
                  granteeOrgName={contact.organization}
                  resolveError={resolveError}
                />
              ) : null}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{getProducerDetailCopy('section_directory', role, t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {getProducerDetailCopy('status_update_hint', role, t)}
                  </p>
                  <PermissionGate permission="contacts:edit">
                    <select
                      value={contact.status}
                      onChange={(event) => void handleStatusChange(event.target.value as ContactStatus)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {CONTACT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getContactStatusLabel(status, t)}
                        </option>
                      ))}
                    </select>
                  </PermissionGate>
                </CardContent>
              </Card>

              {isFarmerSupplier && !isEditing ? (
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
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
