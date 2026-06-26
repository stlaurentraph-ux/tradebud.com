'use client';

import { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listContacts, type ContactRecord, type ContactStatus, updateContactStatus } from '@/lib/contact-service';
import type { ContactActivityType } from '@/lib/contact-activity-types';
import { listContactActivityTypesForRole } from '@/lib/contact-activity-types';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getContactsCtaLabel,
  getContactsEmptyCopy,
  getContactsErrorMessage,
  getContactsFilterAllActivitiesLabel,
  getContactsFilterAllStatusesLabel,
  getContactConsentLabel,
  getContactStatusLabel,
  getContactActivityDisplayLabel,
  getContactTypeLabel,
  getContactsListTitle,
  getContactsNoMatchesLabel,
  getContactsPageSubtitle,
  getContactsPageTitle,
  getContactsSearchPlaceholder,
  getContactsStatLabel,
  getContactsTableColumnLabel,
  getProducerDetailHref,
} from '@/lib/workflow-terminology-labels';
import { Plus, Upload } from 'lucide-react';
import { SupplierOrganizationList } from '@/components/contacts/supplier-organization-list';
import { groupContactsByOrganization } from '@/lib/contact-directory';

const CONTACT_STATUSES: ContactStatus[] = ['new', 'invited', 'engaged', 'submitted', 'inactive', 'blocked'];
const _CONTACT_TABLE_COLUMN_KEYS = [
  'name',
  'email',
  'organization',
  'activity',
  'status',
  'consent',
  'last_activity',
  'update_status',
] as const;
type ContactTableColumnKey = (typeof _CONTACT_TABLE_COLUMN_KEYS)[number];

const CONTACT_TABLE_COLUMNS: Array<{
  key: ContactTableColumnKey;
  minWidth: number;
  defaultWidth: number;
}> = [
  { key: 'name', minWidth: 140, defaultWidth: 180 },
  { key: 'email', minWidth: 180, defaultWidth: 240 },
  { key: 'organization', minWidth: 140, defaultWidth: 180 },
  { key: 'activity', minWidth: 140, defaultWidth: 170 },
  { key: 'status', minWidth: 120, defaultWidth: 130 },
  { key: 'consent', minWidth: 120, defaultWidth: 130 },
  { key: 'last_activity', minWidth: 180, defaultWidth: 220 },
  { key: 'update_status', minWidth: 160, defaultWidth: 180 },
];

export default function ContactsPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const isCooperative = role === 'cooperative';
  const isExporter = role === 'exporter';
  const isImporter = role === 'importer';
  const useOrganizationGrouping = isExporter || isImporter;
  const audience = role ?? isCooperative;
  const navName = isCooperative ? 'Members' : isExporter ? 'Suppliers' : 'Contacts';
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [activityFilter, setActivityFilter] = useState<ContactActivityType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<ContactTableColumnKey, number>>(
    CONTACT_TABLE_COLUMNS.reduce(
      (acc, column) => ({ ...acc, [column.key]: column.defaultWidth }),
      {} as Record<ContactTableColumnKey, number>,
    ),
  );

  const refreshContacts = useCallback(async () => {
    try {
      setError(null);
      const data = await listContacts();
      setContacts(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : getContactsErrorMessage('load', t));
      setContacts([]);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    void refreshContacts();
  }, [refreshContacts]);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase()) ||
        (contact.organization ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      const matchesActivity =
        activityFilter === 'all' || contact.contact_type === activityFilter;
      return matchesSearch && matchesStatus && matchesActivity;
    });
  }, [contacts, search, statusFilter, activityFilter]);

  const activityFilterOptions = useMemo(
    () => listContactActivityTypesForRole(isCooperative ? 'cooperative' : isExporter ? 'exporter' : 'other'),
    [isCooperative, isExporter],
  );

  const stats = useMemo(() => {
    const active = contacts.filter((contact) =>
      ['invited', 'engaged', 'submitted'].includes(contact.status),
    ).length;
    const blocked = contacts.filter((contact) => contact.status === 'blocked').length;
    if (useOrganizationGrouping) {
      const { organizations } = groupContactsByOrganization(contacts);
      return {
        organizations: organizations.length,
        people: contacts.length,
        active,
        blocked,
        total: organizations.length,
      };
    }
    return {
      total: contacts.length,
      active,
      blocked,
      organizations: 0,
      people: contacts.length,
    };
  }, [contacts, useOrganizationGrouping]);

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    try {
      setError(null);
      await updateContactStatus(id, status);
      await refreshContacts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : getContactsErrorMessage('update', t));
    }
  };

  const startColumnResize = (columnKey: ContactTableColumnKey, minWidth: number, startX: number) => {
    const startWidth = columnWidths[columnKey];
    const onMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + (event.clientX - startX));
      setColumnWidths((previous) => ({ ...previous, [columnKey]: nextWidth }));
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <AppHeader
        title={getContactsPageTitle(role ?? isCooperative, t)}
        subtitle={getContactsPageSubtitle(role ?? isCooperative, t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: navName })}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className={`grid gap-4 ${useOrganizationGrouping ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>
          {useOrganizationGrouping ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{getContactsStatLabel('organizations', audience, t)}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{stats.organizations}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{getContactsStatLabel('people', audience, t)}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{stats.people}</CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{getContactsStatLabel('total', audience, t)}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{getContactsStatLabel('active', audience, t)}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{stats.active}</CardContent>
          </Card>
          {!useOrganizationGrouping ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{getContactsStatLabel('blocked', audience, t)}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{stats.blocked}</CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={getContactsSearchPlaceholder(audience, t)}
            className="max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ContactStatus | 'all')}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{getContactsFilterAllStatusesLabel(t)}</option>
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getContactStatusLabel(status, t)}
              </option>
            ))}
          </select>
          <select
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value as ContactActivityType | 'all')}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{getContactsFilterAllActivitiesLabel(t)}</option>
            {activityFilterOptions.map((activity) => (
              <option key={activity} value={activity}>
                {getContactTypeLabel(activity, t)}
              </option>
            ))}
          </select>
          <PermissionGate permission="contacts:create">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/contacts/add?mode=csv">
                  <Upload className="mr-2 h-4 w-4" />
                  {getContactsCtaLabel('import_csv', audience, t)}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/contacts/add?mode=contact">
                  <Plus className="mr-2 h-4 w-4" />
                  {getContactsCtaLabel('add', audience, t)}
                </Link>
              </Button>
            </div>
          </PermissionGate>
        </div>

        {error ? (
          <Card className="border-red-300">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{getContactsListTitle(role ?? isCooperative, t)}</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">{getContactsEmptyCopy('title', audience, t)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getContactsEmptyCopy('description', audience, t)}
                </p>
                <PermissionGate permission="contacts:create">
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {isExporter ? (
                      <>
                        <Button asChild>
                          <Link href="/contacts/add?mode=csv">
                            <Upload className="mr-2 h-4 w-4" />
                            {getContactsCtaLabel('import_csv', audience, t)}
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/contacts/add?mode=contact">
                            <Plus className="mr-2 h-4 w-4" />
                            {getContactsEmptyCopy('cta', audience, t)}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild>
                          <Link href="/contacts/add?mode=contact">
                            <Plus className="mr-2 h-4 w-4" />
                            {getContactsEmptyCopy('cta', audience, t)}
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/contacts/add?mode=csv">
                            <Upload className="mr-2 h-4 w-4" />
                            {getContactsCtaLabel('import_csv', audience, t)}
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </PermissionGate>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">{getContactsNoMatchesLabel(audience, t)}</p>
            ) : useOrganizationGrouping ? (
              <SupplierOrganizationList contacts={filtered} role={role} />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    {CONTACT_TABLE_COLUMNS.map((column) => (
                      <col key={column.key} style={{ width: `${columnWidths[column.key]}px` }} />
                    ))}
                  </colgroup>
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      {CONTACT_TABLE_COLUMNS.map((column) => (
                        <th key={column.key} className="group relative px-3 py-2 font-medium select-none">
                          <span>{getContactsTableColumnLabel(column.key, t)}</span>
                          <button
                            type="button"
                            aria-label={`Resize ${getContactsTableColumnLabel(column.key, t)} column`}
                            className="absolute right-0 top-0 z-10 h-full w-3 cursor-col-resize border-r border-border/50 bg-transparent hover:border-border focus:border-border"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              startColumnResize(column.key, column.minWidth, event.clientX);
                            }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((contact) => (
                      <tr key={contact.id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          <Link
                            href={getProducerDetailHref(contact.id, role, contact.contact_type)}
                            className="text-foreground hover:text-primary hover:underline"
                          >
                            {contact.full_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{contact.email}</td>
                        <td className="px-3 py-2">{contact.organization ?? '—'}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">
                            {getContactActivityDisplayLabel(
                              {
                                contact_type: contact.contact_type,
                                processing_subtype: contact.processing_subtype,
                              },
                              t,
                            )}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{getContactStatusLabel(contact.status, t)}</Badge>
                        </td>
                        <td className="px-3 py-2">
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
                        <td className="px-3 py-2 text-muted-foreground">
                          {contact.last_activity_at ? new Date(contact.last_activity_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <PermissionGate permission="contacts:edit">
                            <select
                              value={contact.status}
                              onChange={(event) => void handleStatusChange(contact.id, event.target.value as ContactStatus)}
                              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
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
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
