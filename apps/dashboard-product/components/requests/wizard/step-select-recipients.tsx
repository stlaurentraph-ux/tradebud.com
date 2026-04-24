'use client';

import { useMemo, useState } from 'react';
import { Building2, User, Map, Search, Check, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export type RecipientType = 'organization' | 'farmer' | 'plot';

export interface Recipient {
  id: string;
  type: RecipientType;
  name: string;
  country: string;
  commodity: string;
  complianceStatus: 'compliant' | 'pending' | 'non_compliant';
  organizationType?: string;
  farmerId?: string;
  farmerName?: string;
  plotSize?: string;
}

export interface RecipientsData {
  selectedRecipients: Recipient[];
}

interface StepSelectRecipientsProps {
  data: RecipientsData;
  availableRecipients: Recipient[];
  onChange: (data: RecipientsData) => void;
  onNext: () => void;
  onBack: () => void;
  mode?: 'request' | 'campaign';
}

const COUNTRIES = ['All Countries', 'Brazil', 'Colombia', 'Ivory Coast', 'Ghana', 'Indonesia', 'Vietnam', 'Peru'];
const COMMODITIES = ['All Commodities', 'Cocoa', 'Coffee', 'Palm Oil', 'Soy', 'Rubber', 'Cattle / Beef', 'Wood / Timber'];
const COMPLIANCE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'pending', label: 'Pending' },
  { value: 'non_compliant', label: 'Non-Compliant' },
];
const BULK_RECIPIENTS_TEMPLATE = `email,full_name,organization,country,commodity
target1@example.com,Jane Doe,North Valley Cooperative,GH,Cocoa
target2@example.com,John Smith,Green Ridge Member Union,CI,Coffee`;

function parseBulkRecipientsCsv(csv: string): Recipient[] {
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
  const commodityIdx = indexOf(['commodity']);
  if (emailIdx < 0 || nameIdx < 0) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const email = (cols[emailIdx] ?? '').toLowerCase();
    const fullName = cols[nameIdx] ?? '';
    if (!email || !fullName || !email.includes('@')) return [];
    return [
      {
        id: `manual-${email}`,
        type: 'farmer' as const,
        name: fullName,
        country: countryIdx >= 0 ? cols[countryIdx] || 'Unknown' : 'Unknown',
        commodity: commodityIdx >= 0 ? cols[commodityIdx] || 'Unknown' : 'Unknown',
        complianceStatus: 'pending' as const,
        organizationType: orgIdx >= 0 ? cols[orgIdx] || undefined : undefined,
      },
    ];
  });
}

export function StepSelectRecipients({
  data,
  availableRecipients,
  onChange,
  onNext,
  onBack,
  mode = 'request',
}: StepSelectRecipientsProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const [activeTab, setActiveTab] = useState<RecipientType>('organization');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');
  const [manualDraft, setManualDraft] = useState({ email: '', fullName: '', organization: '', commodity: '', country: '' });
  const [entryError, setEntryError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    country: 'All Countries',
    commodity: 'All Commodities',
    complianceStatus: 'all',
  });

  const getRecipientTypeLabel = (type: RecipientType, plural = true) => {
    if (type === 'farmer') return plural ? (isCooperative ? 'members' : 'producers') : (isCooperative ? 'member' : 'producer');
    if (type === 'organization') return plural ? 'organizations' : 'organization';
    return plural ? 'plots' : 'plot';
  };

  const filteredRecipients = useMemo(() => {
    return availableRecipients.filter((r) => {
      if (r.type !== activeTab) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.country !== 'All Countries' && r.country !== filters.country) return false;
      if (filters.commodity !== 'All Commodities' && r.commodity !== filters.commodity) return false;
      if (filters.complianceStatus !== 'all' && r.complianceStatus !== filters.complianceStatus) return false;
      return true;
    });
  }, [availableRecipients, activeTab, searchQuery, filters]);

  const isSelected = (recipient: Recipient) => data.selectedRecipients.some((r) => r.id === recipient.id);

  const toggleRecipient = (recipient: Recipient) => {
    if (isSelected(recipient)) {
      onChange({ selectedRecipients: data.selectedRecipients.filter((r) => r.id !== recipient.id) });
      return;
    }
    onChange({ selectedRecipients: [...data.selectedRecipients, recipient] });
  };

  const selectAllFiltered = () => {
    const newSelections = filteredRecipients.filter((r) => !isSelected(r));
    onChange({ selectedRecipients: [...data.selectedRecipients, ...newSelections] });
  };

  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredRecipients.map((r) => r.id));
    onChange({ selectedRecipients: data.selectedRecipients.filter((r) => !filteredIds.has(r.id)) });
  };

  const selectedByType = useMemo(() => {
    const counts = { organization: 0, farmer: 0, plot: 0 };
    data.selectedRecipients.forEach((r) => counts[r.type]++);
    return counts;
  }, [data.selectedRecipients]);

  const allFilteredSelected = filteredRecipients.length > 0 && filteredRecipients.every((r) => isSelected(r));
  const canProceed = data.selectedRecipients.length > 0;

  const mergeRecipients = (incoming: Recipient[]) => {
    const existingIds = new Set(data.selectedRecipients.map((r) => r.id));
    const unique = incoming.filter((r) => !existingIds.has(r.id));
    onChange({ selectedRecipients: [...data.selectedRecipients, ...unique] });
  };

  const handleAddManual = () => {
    const email = manualDraft.email.trim().toLowerCase();
    const fullName = manualDraft.fullName.trim();
    if (!email || !email.includes('@') || !fullName) {
      setEntryError('Manual contact requires a valid email and full name.');
      return;
    }
    setEntryError(null);
    mergeRecipients([
      {
        id: `manual-${email}`,
        type: 'farmer',
        name: fullName,
        country: manualDraft.country.trim() || 'Unknown',
        commodity: manualDraft.commodity.trim() || 'Unknown',
        complianceStatus: 'pending',
        organizationType: manualDraft.organization.trim() || undefined,
      },
    ]);
    setManualDraft({ email: '', fullName: '', organization: '', commodity: '', country: '' });
  };

  const handleImportCsv = () => {
    const parsed = parseBulkRecipientsCsv(bulkCsv);
    if (parsed.length === 0) {
      setEntryError('No valid CSV rows found. Required columns: email, full_name (or name).');
      return;
    }
    setEntryError(null);
    mergeRecipients(parsed);
    setBulkCsv('');
  };

  const handleCsvFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setBulkCsv(text);
      setEntryError(null);
    } catch {
      setEntryError('Failed to read CSV file.');
    }
  };

  return (
    <div className="space-y-6">
      {data.selectedRecipients.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium">
              {data.selectedRecipients.length} recipient{data.selectedRecipients.length !== 1 ? 's' : ''} selected for this {mode}
            </Label>
            <Button variant="ghost" size="sm" onClick={() => onChange({ selectedRecipients: [] })} className="h-auto py-1 text-xs text-muted-foreground">
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.selectedRecipients.slice(0, 8).map((recipient) => (
              <Badge key={recipient.id} variant="secondary" className="gap-1 pr-1">
                {recipient.type === 'organization' && <Building2 className="h-3 w-3" />}
                {recipient.type === 'farmer' && <User className="h-3 w-3" />}
                {recipient.type === 'plot' && <Map className="h-3 w-3" />}
                <span className="max-w-[120px] truncate">{recipient.name}</span>
                <button type="button" onClick={() => toggleRecipient(recipient)} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {data.selectedRecipients.length > 8 && <Badge variant="outline">+{data.selectedRecipients.length - 8} more</Badge>}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RecipientType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organizations</span>
            <span className="sm:hidden">Orgs</span>
            {selectedByType.organization > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedByType.organization}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="farmer" className="gap-2">
            <User className="h-4 w-4" />
            {isCooperative ? 'Members' : 'Producers'}
            {selectedByType.farmer > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedByType.farmer}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="plot" className="gap-2">
            <Map className="h-4 w-4" />
            Plots
            {selectedByType.plot > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedByType.plot}</Badge>}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${getRecipientTypeLabel(activeTab, true)}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Select value={filters.country} onValueChange={(v) => setFilters({ ...filters, country: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Commodity</Label>
                  <Select value={filters.commodity} onValueChange={(v) => setFilters({ ...filters, commodity: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMODITIES.map((commodity) => <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Compliance Status</Label>
                  <Select value={filters.complianceStatus} onValueChange={(v) => setFilters({ ...filters, complianceStatus: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPLIANCE_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredRecipients.length} {getRecipientTypeLabel(activeTab, filteredRecipients.length !== 1)} found
          </span>
          {allFilteredSelected ? (
            <Button variant="ghost" size="sm" onClick={deselectAllFiltered} className="h-8 text-xs">Deselect all matching</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={selectAllFiltered} disabled={filteredRecipients.length === 0} className="h-8 text-xs">
              Select all matching ({filteredRecipients.length})
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="mt-3">
          <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
            {filteredRecipients.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No {getRecipientTypeLabel(activeTab, true)} found matching your criteria.
              </div>
            ) : (
              filteredRecipients.map((recipient) => (
                <RecipientRow key={recipient.id} recipient={recipient} selected={isSelected(recipient)} onToggle={() => toggleRecipient(recipient)} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <Label className="text-sm font-semibold">Add recipients manually or via CSV</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Email"
            value={manualDraft.email}
            onChange={(e) => setManualDraft((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            placeholder="Full name"
            value={manualDraft.fullName}
            onChange={(e) => setManualDraft((p) => ({ ...p, fullName: e.target.value }))}
          />
          <Input
            placeholder="Organization (optional)"
            value={manualDraft.organization}
            onChange={(e) => setManualDraft((p) => ({ ...p, organization: e.target.value }))}
          />
          <Input
            placeholder="Commodity (optional)"
            value={manualDraft.commodity}
            onChange={(e) => setManualDraft((p) => ({ ...p, commodity: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleAddManual}>
            Add manually
          </Button>
        </div>
        <textarea
          value={bulkCsv}
          onChange={(e) => setBulkCsv(e.target.value)}
          placeholder="Paste recipients CSV here..."
          className="min-h-[120px] w-full rounded-md border border-border bg-background p-3 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-2 text-sm hover:bg-muted">
            Upload CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                void handleCsvFileUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <Button type="button" variant="outline" onClick={() => setBulkCsv(BULK_RECIPIENTS_TEMPLATE)}>
            Paste sample CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const blob = new Blob([BULK_RECIPIENTS_TEMPLATE], { type: 'text/csv;charset=utf-8' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'tracebud_recipients_template.csv';
              link.click();
              URL.revokeObjectURL(link.href);
            }}
          >
            Download CSV template
          </Button>
          <Button type="button" onClick={handleImportCsv} disabled={!bulkCsv.trim()}>
            Import CSV recipients
          </Button>
        </div>
        {entryError ? <p className="text-xs text-red-600">{entryError}</p> : null}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canProceed}>Continue</Button>
      </div>
    </div>
  );
}

function RecipientRow({ recipient, selected, onToggle }: { recipient: Recipient; selected: boolean; onToggle: () => void }) {
  const complianceColors = {
    compliant: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    non_compliant: 'bg-red-100 text-red-800',
  };

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
        selected && 'border-primary bg-primary/5',
      )}
      onClick={onToggle}
    >
      <Checkbox checked={selected} className="pointer-events-none" />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {recipient.type === 'organization' && <Building2 className="h-4 w-4 text-muted-foreground" />}
        {recipient.type === 'farmer' && <User className="h-4 w-4 text-muted-foreground" />}
        {recipient.type === 'plot' && <Map className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{recipient.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {recipient.country} &bull; {recipient.commodity}
          {recipient.type === 'plot' && recipient.farmerName ? <> &bull; {recipient.farmerName}</> : null}
        </p>
      </div>
      <Badge variant="secondary" className={cn('shrink-0 text-xs', complianceColors[recipient.complianceStatus])}>
        {recipient.complianceStatus === 'non_compliant'
          ? 'Non-Compliant'
          : recipient.complianceStatus.charAt(0).toUpperCase() + recipient.complianceStatus.slice(1)}
      </Badge>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </div>
  );
}
