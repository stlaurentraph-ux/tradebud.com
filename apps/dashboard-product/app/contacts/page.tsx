'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listContacts, type ContactRecord, type ContactStatus, updateContactStatus } from '@/lib/contact-service';
import { Plus, Upload } from 'lucide-react';

const CONTACT_STATUSES: ContactStatus[] = ['new', 'invited', 'engaged', 'submitted', 'inactive', 'blocked'];
const CONTACT_TABLE_COLUMNS = [
  { key: 'name', label: 'Name', minWidth: 140, defaultWidth: 180 },
  { key: 'email', label: 'Email', minWidth: 180, defaultWidth: 240 },
  { key: 'organization', label: 'Organization', minWidth: 140, defaultWidth: 180 },
  { key: 'status', label: 'Status', minWidth: 120, defaultWidth: 130 },
  { key: 'consent', label: 'Consent', minWidth: 120, defaultWidth: 130 },
  { key: 'last_activity', label: 'Last activity', minWidth: 180, defaultWidth: 220 },
  { key: 'update_status', label: 'Update status', minWidth: 160, defaultWidth: 180 },
] as const;
type ContactTableColumnKey = (typeof CONTACT_TABLE_COLUMNS)[number]['key'];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<ContactTableColumnKey, number>>(
    CONTACT_TABLE_COLUMNS.reduce(
      (acc, column) => ({ ...acc, [column.key]: column.defaultWidth }),
      {} as Record<ContactTableColumnKey, number>,
    ),
  );

  const refreshContacts = async () => {
    try {
      setError(null);
      const data = await listContacts();
      setContacts(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load contacts.');
      setContacts([]);
    }
  };

  useEffect(() => {
    void refreshContacts();
  }, []);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase()) ||
        (contact.organization ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: contacts.length,
      active: contacts.filter((contact) => ['invited', 'engaged', 'submitted'].includes(contact.status)).length,
      blocked: contacts.filter((contact) => contact.status === 'blocked').length,
    };
  }, [contacts]);

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    try {
      setError(null);
      await updateContactStatus(id, status);
      await refreshContacts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update status.');
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
      <AppHeader title="Contacts" subtitle="Tenant CRM" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm">Total Contacts</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Active Pipeline</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.active}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Blocked</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.blocked}</CardContent></Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, org"
            className="max-w-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ContactStatus | 'all')}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <PermissionGate permission="contacts:create">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/contacts/add?mode=csv">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button asChild>
                <Link href="/contacts/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
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
          <CardHeader><CardTitle>Contact list</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts match your filters yet.</p>
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
                          <span>{column.label}</span>
                          <button
                            type="button"
                            aria-label={`Resize ${column.label} column`}
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
                        <td className="px-3 py-2 font-medium">{contact.full_name}</td>
                        <td className="px-3 py-2">{contact.email}</td>
                        <td className="px-3 py-2">{contact.organization ?? '—'}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{contact.status}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          {contact.consent_status !== 'unknown' ? (
                            <Badge variant="secondary">{contact.consent_status}</Badge>
                          ) : (
                            <span className="text-muted-foreground">unknown</span>
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
                                <option key={status} value={status}>{status}</option>
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

