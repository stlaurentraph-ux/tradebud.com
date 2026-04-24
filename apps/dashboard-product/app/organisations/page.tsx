'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload } from 'lucide-react';
import { useSponsorView } from '@/lib/sponsor-view';

type OrganisationRow = {
  id: string;
  name: string;
  type: 'Cooperative' | 'Exporter' | 'Importer' | 'NGO';
  roleInNetwork: string;
  relationship: 'Direct Sponsor Member' | 'Partner Network Member' | 'Buyer-linked Member';
  country: string;
  onboardingCompleteness: number;
  fundingCoverage: 'Sponsored' | 'Mixed' | 'Pass-through';
};

const organisations: OrganisationRow[] = [
  {
    id: 'org-1',
    name: 'North Highlands Cooperative',
    type: 'Cooperative',
    roleInNetwork: 'Origin aggregator',
    relationship: 'Direct Sponsor Member',
    country: 'Peru',
    onboardingCompleteness: 92,
    fundingCoverage: 'Sponsored',
  },
  {
    id: 'org-2',
    name: 'Rift Valley Producer Alliance',
    type: 'Cooperative',
    roleInNetwork: 'Producer network lead',
    relationship: 'Partner Network Member',
    country: 'Kenya',
    onboardingCompleteness: 84,
    fundingCoverage: 'Mixed',
  },
  {
    id: 'org-3',
    name: 'Atlantic Export Hub',
    type: 'Exporter',
    roleInNetwork: 'Export execution partner',
    relationship: 'Buyer-linked Member',
    country: 'Ghana',
    onboardingCompleteness: 78,
    fundingCoverage: 'Pass-through',
  },
];

function mapBackendOrganisation(record: Record<string, unknown>): OrganisationRow {
  const relationship =
    record.relationship === 'Direct Sponsor Member' ||
    record.relationship === 'Partner Network Member' ||
    record.relationship === 'Buyer-linked Member'
      ? (record.relationship as OrganisationRow['relationship'])
      : 'Partner Network Member';
  const fundingCoverage =
    record.fundingCoverage === 'Sponsored' || record.fundingCoverage === 'Pass-through'
      ? (record.fundingCoverage as OrganisationRow['fundingCoverage'])
      : 'Mixed';
  const type =
    record.type === 'Cooperative' || record.type === 'Exporter' || record.type === 'Importer' || record.type === 'NGO'
      ? (record.type as OrganisationRow['type'])
      : 'Cooperative';
  const completenessRaw = Number(record.onboardingCompleteness);
  return {
    id: String(record.id ?? crypto.randomUUID()),
    name: String(record.name ?? 'Unnamed Organisation'),
    type,
    roleInNetwork: String(record.roleInNetwork ?? 'Network member'),
    relationship,
    country: String(record.country ?? 'Unknown'),
    onboardingCompleteness: Number.isFinite(completenessRaw) ? completenessRaw : 0,
    fundingCoverage,
  };
}

function parseBulkOrganisationCsv(csv: string): OrganisationRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const indexOf = (keys: string[]) => keys.map((key) => header.indexOf(key)).find((idx) => idx >= 0) ?? -1;
  const nameIdx = indexOf(['organisation_name', 'organization_name', 'name']);
  const typeIdx = indexOf(['type']);
  const roleIdx = indexOf(['role_in_network', 'role']);
  const relIdx = indexOf(['relationship']);
  const countryIdx = indexOf(['country']);

  if (nameIdx < 0 || typeIdx < 0 || roleIdx < 0 || relIdx < 0 || countryIdx < 0) return [];

  return lines.slice(1).flatMap((line, rowIndex) => {
    const cols = line.split(',').map((item) => item.trim());
    const name = cols[nameIdx] ?? '';
    const type = cols[typeIdx] as OrganisationRow['type'] | undefined;
    const roleInNetwork = cols[roleIdx] ?? '';
    const relationship = cols[relIdx] as OrganisationRow['relationship'] | undefined;
    const country = cols[countryIdx] ?? '';

    if (!name || !type || !roleInNetwork || !relationship || !country) return [];

    return [
      {
        id: `org-csv-${rowIndex + 1}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        type,
        roleInNetwork,
        relationship,
        country,
        onboardingCompleteness: 0,
        fundingCoverage: 'Mixed',
      },
    ];
  });
}

export default function OrganisationsPage() {
  const sponsorView = useSponsorView();
  const [organisationRows, setOrganisationRows] = useState<OrganisationRow[]>(organisations);
  const [addMode, setAddMode] = useState<'manual' | 'bulk'>('manual');
  const [bulkCsv, setBulkCsv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [manualDraft, setManualDraft] = useState({
    name: '',
    type: '',
    roleInNetwork: '',
    country: '',
    relationship: '',
  });
  const orderedOrganisations =
    sponsorView === 'country'
      ? organisationRows
      : [...organisationRows].sort((a, b) => {
          const score = (funding: string) => (funding === 'Sponsored' ? 0 : funding === 'Mixed' ? 1 : 2);
          return score(a.fundingCoverage) - score(b.fundingCoverage);
        });

  const averageCompleteness = useMemo(
    () =>
      Math.round(
        orderedOrganisations.reduce((sum, organisation) => sum + organisation.onboardingCompleteness, 0) /
          orderedOrganisations.length
      ),
    [orderedOrganisations]
  );

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    setIsLoading(true);
    fetch('/api/admin/organizations', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, status: response.status, payload })))
      .then(({ ok, status, payload }) => {
        if (!ok) {
          setFormError(
            typeof payload?.error === 'string'
              ? payload.error
              : `Unable to load organisations from backend (status ${status}).`
          );
          return;
        }
        if (Array.isArray(payload)) {
          const mapped = payload
            .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
            .map(mapBackendOrganisation);
          if (mapped.length > 0) {
            setOrganisationRows(mapped);
          }
        }
      })
      .catch(() => setFormError('Unable to load organisations from backend.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddOrganisation = () => {
    const name = manualDraft.name.trim();
    const type = manualDraft.type.trim() as OrganisationRow['type'];
    const roleInNetwork = manualDraft.roleInNetwork.trim();
    const relationship = manualDraft.relationship.trim() as OrganisationRow['relationship'];
    const country = manualDraft.country.trim();

    if (!name || !type || !roleInNetwork || !relationship || !country) {
      setFormError('Please complete all required fields to add an organisation.');
      setFormMessage(null);
      return;
    }

    const token = window.sessionStorage.getItem('tracebud_token');
    setIsSaving(true);
    fetch('/api/admin/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name,
        type,
        roleInNetwork,
        relationship,
        country,
        onboardingCompleteness: 0,
        fundingCoverage: 'Mixed',
      }),
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, status: response.status, payload })))
      .then(({ ok, status, payload }) => {
        if (!ok) {
          setFormError(
            typeof payload?.error === 'string'
              ? payload.error
              : `Failed to create organisation in backend (status ${status}).`
          );
          setFormMessage(null);
          return;
        }
        setOrganisationRows((previous) => [mapBackendOrganisation((payload as Record<string, unknown>) ?? {}), ...previous]);
        setManualDraft({ name: '', type: '', roleInNetwork: '', country: '', relationship: '' });
        setFormError(null);
        setFormMessage(`Added ${name}.`);
      })
      .catch(() => {
        setFormError('Failed to create organisation in backend.');
        setFormMessage(null);
      })
      .finally(() => setIsSaving(false));
  };

  const handleImportCsv = () => {
    const parsedRows = parseBulkOrganisationCsv(bulkCsv);
    if (parsedRows.length === 0) {
      setFormError(
        'No valid rows found. Expected columns: organisation_name, type, role_in_network, relationship, country.'
      );
      setFormMessage(null);
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    setIsSaving(true);
    Promise.all(
      parsedRows.map((row) =>
        fetch('/api/admin/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(row),
        }).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(typeof payload?.error === 'string' ? payload.error : 'Failed to import one or more organisations.');
          }
          return mapBackendOrganisation(payload as Record<string, unknown>);
        })
      )
    )
      .then((createdRows) => {
        setOrganisationRows((previous) => [...createdRows, ...previous]);
        setBulkCsv('');
        setFormError(null);
        setFormMessage(`Imported ${createdRows.length} organisation${createdRows.length === 1 ? '' : 's'}.`);
      })
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : 'Failed to import organisations.');
        setFormMessage(null);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Organisations"
        subtitle={
          sponsorView === 'country'
            ? 'Sponsor-scoped directory for network activation, readiness, and country coverage'
            : 'Sponsor-scoped directory for supplier performance, funded coverage, and value-chain visibility'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organisations' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{orderedOrganisations.length}</p>
              <p className="text-xs text-muted-foreground">Governed organisations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{averageCompleteness}%</p>
              <p className="text-xs text-muted-foreground">Average onboarding completeness</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">
                {orderedOrganisations.filter((organisation) => organisation.relationship === 'Direct Sponsor Member').length}
              </p>
              <p className="text-xs text-muted-foreground">Direct sponsor members</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organisation Directory</CardTitle>
            <CardDescription>
              {sponsorView === 'country'
                ? 'Prioritises ecosystem activation and readiness by country and organisation type.'
                : 'Prioritises sponsored suppliers and value-chain entities with direct funding impact.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Coverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedOrganisations.map((organisation) => (
                  <TableRow key={organisation.id}>
                    <TableCell className="font-medium">{organisation.name}</TableCell>
                    <TableCell>{organisation.type}</TableCell>
                    <TableCell>{organisation.roleInNetwork}</TableCell>
                    <TableCell>{organisation.relationship}</TableCell>
                    <TableCell>{organisation.country}</TableCell>
                    <TableCell>{organisation.onboardingCompleteness}%</TableCell>
                    <TableCell>
                      <Badge variant={organisation.fundingCoverage === 'Sponsored' ? 'default' : 'secondary'}>
                        {organisation.fundingCoverage}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading organisations from backend...</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Organisations</CardTitle>
            <CardDescription>Add organisations manually or import them in bulk via CSV.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={addMode} onValueChange={(value) => setAddMode(value as 'manual' | 'bulk')}>
              <TabsList>
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="bulk">Bulk import</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-3 pt-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Organisation name</Label>
                    <Input
                      value={manualDraft.name}
                      onChange={(event) => setManualDraft((previous) => ({ ...previous, name: event.target.value }))}
                      placeholder="e.g. Highlands Cooperative Union"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Input
                      value={manualDraft.type}
                      onChange={(event) => setManualDraft((previous) => ({ ...previous, type: event.target.value }))}
                      placeholder="Cooperative / Exporter / Importer / NGO"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role in network</Label>
                    <Input
                      value={manualDraft.roleInNetwork}
                      onChange={(event) => setManualDraft((previous) => ({ ...previous, roleInNetwork: event.target.value }))}
                      placeholder="Origin aggregator"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relationship</Label>
                    <Input
                      value={manualDraft.relationship}
                      onChange={(event) => setManualDraft((previous) => ({ ...previous, relationship: event.target.value }))}
                      placeholder="Direct Sponsor Member"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input
                      value={manualDraft.country}
                      onChange={(event) => setManualDraft((previous) => ({ ...previous, country: event.target.value }))}
                      placeholder="Peru"
                    />
                  </div>
                </div>
                <Button>
                <Button onClick={handleAddOrganisation} disabled={isSaving}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Add organisation'}
                </Button>
              </TabsContent>
              <TabsContent value="bulk" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">
                  Expected CSV columns: organisation_name, type, role_in_network, relationship, country
                </p>
                <textarea
                  value={bulkCsv}
                  onChange={(event) => setBulkCsv(event.target.value)}
                  placeholder="Paste organisation CSV rows here..."
                  className="min-h-[120px] w-full rounded-md border border-border bg-background p-3 text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                  <Button disabled={!bulkCsv.trim() || isSaving} onClick={handleImportCsv}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? 'Importing...' : 'Import organisations'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {formMessage ? <p className="text-sm text-emerald-700">{formMessage}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
