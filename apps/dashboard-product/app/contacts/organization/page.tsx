'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, UserPlus } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  buildAddColleagueHref,
  findOrganizationGroup,
  pickOrganizationPrimaryContact,
} from '@/lib/contact-directory';
import {
  listContacts,
  updateContactStatus,
  type ContactRecord,
  type ContactStatus,
} from '@/lib/contact-service';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getContactActivityDisplayLabel,
  getContactConsentLabel,
  getContactDetailActionLabel,
  getContactStatusLabel,
  getContactsErrorMessage,
  getContactsOrgCopy,
  getContactsPageTitle,
  getProducerDetailHref,
} from '@/lib/workflow-terminology-labels';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';

const CONTACT_STATUSES: ContactStatus[] = ['new', 'invited', 'engaged', 'submitted', 'inactive', 'blocked'];

export default function ContactOrganizationPage() {
  return (
    <SearchParamsPageBoundary>
      <ContactOrganizationPageContent />
    </SearchParamsPageBoundary>
  );
}

function ContactOrganizationPageContent() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationName = searchParams.get('organization')?.trim() ?? '';
  const { user } = useAuth();
  const role = user?.active_role;
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContacts = useCallback(async () => {
    try {
      setError(null);
      const data = await listContacts();
      setContacts(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : getContactsErrorMessage('load', t));
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshContacts();
  }, [refreshContacts]);

  const group = useMemo(
    () => (organizationName ? findOrganizationGroup(contacts, organizationName) : null),
    [contacts, organizationName],
  );

  const primary = group ? pickOrganizationPrimaryContact(group.contacts) : null;

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    try {
      setError(null);
      await updateContactStatus(id, status);
      await refreshContacts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : getContactsErrorMessage('update', t));
    }
  };

  if (!organizationName) {
    router.replace('/contacts');
    return null;
  }

  return (
    <>
      <AppHeader
        title={group?.displayName ?? getContactsOrgCopy('page_title', t)}
        subtitle={getContactsOrgCopy('page_subtitle', t)}
        breadcrumbs={buildAppBreadcrumbs(
          t,
          { name: getContactsPageTitle(role, t), href: '/contacts' },
          { name: group?.displayName ?? organizationName },
        )}
      />
      <div className="flex-1 space-y-6 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contacts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getContactsOrgCopy('back_to_directory', t)}
          </Link>
        </Button>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !group ? (
          <Alert variant="destructive">
            <AlertDescription>{getContactsOrgCopy('not_found', t)}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle>{group.displayName}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {getContactActivityDisplayLabel(
                          {
                            contact_type: group.contact_type,
                            processing_subtype: group.processing_subtype,
                          },
                          t,
                        )}
                      </Badge>
                      {group.country ? (
                        <span className="text-sm text-muted-foreground">{group.country}</span>
                      ) : null}
                      <span className="text-sm text-muted-foreground">
                        {getContactsOrgCopy('people_count', t, { count: group.contacts.length })}
                      </span>
                    </div>
                  </div>
                </div>
                {primary ? (
                  <PermissionGate permission="contacts:create">
                    <Button asChild>
                      <Link href={buildAddColleagueHref(primary)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {getContactDetailActionLabel('add_colleague', t)}
                      </Link>
                    </Button>
                  </PermissionGate>
                ) : null}
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{getContactsOrgCopy('column_person', t)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">{getContactsOrgCopy('column_person', t)}</th>
                        <th className="px-4 py-2 font-medium">{getContactsOrgCopy('column_email', t)}</th>
                        <th className="px-4 py-2 font-medium">{getContactsOrgCopy('column_status', t)}</th>
                        <th className="px-4 py-2 font-medium">{getContactsOrgCopy('column_consent', t)}</th>
                        <th className="px-4 py-2 font-medium">{getContactsOrgCopy('column_update_status', t)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.contacts.map((contact) => (
                        <tr key={contact.id} className="border-t">
                          <td className="px-4 py-3">
                            <Link
                              href={getProducerDetailHref(contact.id, role, contact.contact_type)}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {contact.full_name}
                            </Link>
                            {contact.phone ? (
                              <p className="text-xs text-muted-foreground">{contact.phone}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{contact.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{getContactStatusLabel(contact.status, t)}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {contact.consent_status !== 'unknown' ? (
                              <Badge variant="secondary">
                                {getContactConsentLabel(contact.consent_status, t)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {getContactConsentLabel('unknown', t)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <PermissionGate permission="contacts:edit">
                              <select
                                value={contact.status}
                                onChange={(event) =>
                                  void handleStatusChange(contact.id, event.target.value as ContactStatus)
                                }
                                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                              >
                                {CONTACT_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {getContactStatusLabel(status, t)}
                                  </option>
                                ))}
                              </select>
                            </PermissionGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
