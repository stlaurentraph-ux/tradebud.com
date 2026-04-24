'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createContact, listContacts, type ContactRecord, type ContactStatus, updateContactStatus } from '@/lib/contact-service';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';

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
const BULK_CONTACTS_TEMPLATE = `email,full_name,organization,country,phone
contact1@example.com,Jane Doe,North Valley Cooperative,GH,+2335550101
contact2@example.com,John Smith,Green Ridge Producers,CI,+22507000102`;

function parseBulkContactsCsv(csv: string): Array<{
  email: string;
  full_name: string;
  organization?: string | null;
  country?: string | null;
  phone?: string | null;
}> {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const indexOf = (keys: string[]) => keys.map((key) => header.indexOf(key)).find((idx) => idx >= 0) ?? -1;
  const emailIdx = indexOf(['email']);
  const nameIdx = indexOf(['full_name', 'name']);
  const orgIdx = indexOf(['organization', 'org']);
  const countryIdx = indexOf(['country']);
  const phoneIdx = indexOf(['phone']);
  if (emailIdx < 0 || nameIdx < 0) return [];

  const parsed: Array<{
    email: string;
    full_name: string;
    organization?: string | null;
    country?: string | null;
    phone?: string | null;
  }> = [];

  for (const line of lines.slice(1)) {
    const cols = line.split(',').map((c) => c.trim());
    const email = (cols[emailIdx] ?? '').toLowerCase();
    const full_name = cols[nameIdx] ?? '';
    if (!email || !full_name || !email.includes('@')) continue;
    parsed.push({
      email,
      full_name,
      organization: orgIdx >= 0 ? cols[orgIdx] || null : null,
      country: countryIdx >= 0 ? cols[countryIdx] || null : null,
      phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
    });
  }
  return parsed;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [draft, setDraft] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
    country: '',
  });
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

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await createContact({
        full_name: draft.full_name,
        email: draft.email,
        phone: draft.phone || null,
        organization: draft.organization || null,
        country: draft.country || null,
      });
      setDraft({ full_name: '', email: '', phone: '', organization: '', country: '' });
      setIsDialogOpen(false);
      markOnboardingAction('contacts_uploaded');
      await refreshContacts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to create contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    setBulkImporting(true);
    setError(null);
    try {
      const rows = parseBulkContactsCsv(bulkCsv);
      if (rows.length === 0) {
        throw new Error('No valid rows found. Required columns: email, full_name (or name).');
      }
      let importedCount = 0;
      for (const row of rows) {
        try {
          await createContact(row);
          importedCount += 1;
        } catch {
          // Continue import on per-row failures (e.g., duplicates)
        }
      }
      if (importedCount === 0) {
        throw new Error('No contacts were imported. Check CSV rows or duplicates.');
      }
      markOnboardingAction('contacts_uploaded');
      await refreshContacts();
      setBulkCsv('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to import CSV contacts.');
    } finally {
      setBulkImporting(false);
    }
  };

  const handleBulkCsvFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setBulkCsv(text);
    } catch {
      setError('Failed to read CSV file.');
    }
  };

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
      <AppHeader
        title={isCooperative ? 'Members' : 'Contacts'}
        subtitle={
          isCooperative
            ? 'Manage member identity, consent status, and portability readiness'
            : 'Tenant CRM'
        }
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm">{isCooperative ? 'Total Members' : 'Total Contacts'}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">{isCooperative ? 'Active Membership' : 'Active Pipeline'}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.active}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">{isCooperative ? 'Membership Blockers' : 'Blocked'}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.blocked}</CardContent></Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isCooperative ? 'Search member by name, email, cooperative, or status' : 'Search by name, email, org'}
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Contact</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                <DialogTitle>{isCooperative ? 'Add member' : 'Add contact'}</DialogTitle>
                <DialogDescription>
                  {isCooperative
                    ? 'Create or upsert a cooperative member profile for consent and portability workflows.'
                    : 'Create or upsert a contact inside your tenant CRM.'}
                </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div><Label>Full name</Label><Input value={draft.full_name} onChange={(e) => setDraft((p) => ({ ...p, full_name: e.target.value }))} /></div>
                  <div><Label>Email</Label><Input value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>Organization</Label><Input value={draft.organization} onChange={(e) => setDraft((p) => ({ ...p, organization: e.target.value }))} /></div>
                  <div><Label>Country</Label><Input value={draft.country} onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))} placeholder="e.g. BR" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={saving || !draft.full_name || !draft.email}>
                    {saving ? 'Saving...' : 'Save contact'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>

        <PermissionGate permission="contacts:create">
          <Card>
            <CardHeader>
              <CardTitle>{isCooperative ? 'Import members (CSV) or add manually' : 'Import contacts (CSV) or add manually'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="bulk-contacts-csv">Bulk contacts CSV</Label>
              <textarea
                id="bulk-contacts-csv"
                value={bulkCsv}
                onChange={(event) => setBulkCsv(event.target.value)}
                placeholder="Paste CSV here..."
                className="min-h-[140px] w-full rounded-md border border-border bg-background p-3 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-2 text-sm hover:bg-muted">
                  Upload CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      void handleBulkCsvFileUpload(event.target.files?.[0] ?? null);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <Button variant="outline" onClick={() => setBulkCsv(BULK_CONTACTS_TEMPLATE)}>
                  Paste sample CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([BULK_CONTACTS_TEMPLATE], { type: 'text/csv;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'tracebud_contacts_template.csv';
                    link.click();
                    URL.revokeObjectURL(link.href);
                  }}
                >
                  Download CSV template
                </Button>
                <Button onClick={() => void handleBulkImport()} disabled={bulkImporting || !bulkCsv.trim()}>
                  {bulkImporting ? 'Importing...' : 'Import CSV contacts'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can still use the <strong>{isCooperative ? 'Add Member' : 'Add Contact'}</strong> button above for one-by-one manual entry.
              </p>
            </CardContent>
          </Card>
        </PermissionGate>

        {error ? (
          <Card className="border-red-300">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle>{isCooperative ? 'Member directory' : 'Contact list'}</CardTitle></CardHeader>
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

