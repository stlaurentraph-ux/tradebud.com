'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  User,
  Map,
  Search,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Types
export type RecipientType = 'organization' | 'farmer' | 'plot';

export interface Recipient {
  id: string;
  type: RecipientType;
  name: string;
  country: string;
  commodity: string;
  complianceStatus: 'compliant' | 'pending' | 'non_compliant';
  // Additional fields based on type
  organizationType?: string; // for organizations
  farmerId?: string; // for plots
  farmerName?: string; // for plots
  plotSize?: string; // for plots
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
}

const COUNTRIES = [
  'All Countries',
  'Brazil',
  'Colombia',
  'Ivory Coast',
  'Ghana',
  'Indonesia',
  'Vietnam',
  'Peru',
  'Ecuador',
];

const COMMODITIES = [
  'All Commodities',
  'Cocoa',
  'Coffee',
  'Palm Oil',
  'Soy',
  'Rubber',
  'Cattle / Beef',
  'Wood / Timber',
];

const COMPLIANCE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'pending', label: 'Pending' },
  { value: 'non_compliant', label: 'Non-Compliant' },
];

export function StepSelectRecipients({
  data,
  availableRecipients,
  onChange,
  onNext,
  onBack,
}: StepSelectRecipientsProps) {
  const [activeTab, setActiveTab] = useState<RecipientType>('organization');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    country: 'All Countries',
    commodity: 'All Commodities',
    complianceStatus: 'all',
  });

  // Filter recipients by type and search/filters
  const filteredRecipients = useMemo(() => {
    return availableRecipients.filter((r) => {
      // Filter by type (tab)
      if (r.type !== activeTab) return false;

      // Filter by search query
      if (
        searchQuery &&
        !r.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filter by country
      if (
        filters.country !== 'All Countries' &&
        r.country !== filters.country
      ) {
        return false;
      }

      // Filter by commodity
      if (
        filters.commodity !== 'All Commodities' &&
        r.commodity !== filters.commodity
      ) {
        return false;
      }

      // Filter by compliance status
      if (
        filters.complianceStatus !== 'all' &&
        r.complianceStatus !== filters.complianceStatus
      ) {
        return false;
      }

      return true;
    });
  }, [availableRecipients, activeTab, searchQuery, filters]);

  // Check if a recipient is selected
  const isSelected = (recipient: Recipient) => {
    return data.selectedRecipients.some((r) => r.id === recipient.id);
  };

  // Toggle recipient selection
  const toggleRecipient = (recipient: Recipient) => {
    if (isSelected(recipient)) {
      onChange({
        selectedRecipients: data.selectedRecipients.filter(
          (r) => r.id !== recipient.id
        ),
      });
    } else {
      onChange({
        selectedRecipients: [...data.selectedRecipients, recipient],
      });
    }
  };

  // Select all filtered recipients
  const selectAllFiltered = () => {
    const newSelections = filteredRecipients.filter((r) => !isSelected(r));
    onChange({
      selectedRecipients: [...data.selectedRecipients, ...newSelections],
    });
  };

  // Deselect all filtered recipients
  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredRecipients.map((r) => r.id));
    onChange({
      selectedRecipients: data.selectedRecipients.filter(
        (r) => !filteredIds.has(r.id)
      ),
    });
  };

  // Count selected by type
  const selectedByType = useMemo(() => {
    const counts = { organization: 0, farmer: 0, plot: 0 };
    data.selectedRecipients.forEach((r) => {
      counts[r.type]++;
    });
    return counts;
  }, [data.selectedRecipients]);

  // Remove a selected recipient
  const removeRecipient = (recipient: Recipient) => {
    onChange({
      selectedRecipients: data.selectedRecipients.filter(
        (r) => r.id !== recipient.id
      ),
    });
  };

  const allFilteredSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((r) => isSelected(r));

  const canProceed = data.selectedRecipients.length > 0;

  return (
    <div className="space-y-6">
      {/* Selected Recipients Summary */}
      {data.selectedRecipients.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium">
              {data.selectedRecipients.length} recipient
              {data.selectedRecipients.length !== 1 ? 's' : ''} selected
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ selectedRecipients: [] })}
              className="h-auto py-1 text-xs text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.selectedRecipients.slice(0, 8).map((recipient) => (
              <Badge
                key={recipient.id}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {recipient.type === 'organization' && (
                  <Building2 className="h-3 w-3" />
                )}
                {recipient.type === 'farmer' && <User className="h-3 w-3" />}
                {recipient.type === 'plot' && <Map className="h-3 w-3" />}
                <span className="max-w-[120px] truncate">{recipient.name}</span>
                <button
                  onClick={() => removeRecipient(recipient)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {data.selectedRecipients.length > 8 && (
              <Badge variant="outline">
                +{data.selectedRecipients.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as RecipientType)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organizations</span>
            <span className="sm:hidden">Orgs</span>
            {selectedByType.organization > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedByType.organization}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="farmer" className="gap-2">
            <User className="h-4 w-4" />
            Farmers
            {selectedByType.farmer > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedByType.farmer}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plot" className="gap-2">
            <Map className="h-4 w-4" />
            Plots
            {selectedByType.plot > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedByType.plot}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}s...`}
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
                  {filtersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Select
                    value={filters.country}
                    onValueChange={(v) =>
                      setFilters({ ...filters, country: v })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Commodity</Label>
                  <Select
                    value={filters.commodity}
                    onValueChange={(v) =>
                      setFilters({ ...filters, commodity: v })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMODITIES.map((commodity) => (
                        <SelectItem key={commodity} value={commodity}>
                          {commodity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Compliance Status</Label>
                  <Select
                    value={filters.complianceStatus}
                    onValueChange={(v) =>
                      setFilters({ ...filters, complianceStatus: v })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Bulk Actions */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredRecipients.length} {activeTab}
            {filteredRecipients.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex items-center gap-2">
            {allFilteredSelected ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAllFiltered}
                className="h-8 text-xs"
              >
                Deselect all matching
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllFiltered}
                disabled={filteredRecipients.length === 0}
                className="h-8 text-xs"
              >
                Select all matching ({filteredRecipients.length})
              </Button>
            )}
          </div>
        </div>

        {/* Recipient List */}
        <TabsContent value={activeTab} className="mt-3">
          <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
            {filteredRecipients.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No {activeTab}s found matching your criteria.
              </div>
            ) : (
              filteredRecipients.map((recipient) => (
                <RecipientRow
                  key={recipient.id}
                  recipient={recipient}
                  selected={isSelected(recipient)}
                  onToggle={() => toggleRecipient(recipient)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Recipient Row Component
function RecipientRow({
  recipient,
  selected,
  onToggle,
}: {
  recipient: Recipient;
  selected: boolean;
  onToggle: () => void;
}) {
  const complianceColors = {
    compliant: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    non_compliant: 'bg-red-100 text-red-800',
  };

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
        selected && 'border-primary bg-primary/5'
      )}
      onClick={onToggle}
    >
      <Checkbox checked={selected} className="pointer-events-none" />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {recipient.type === 'organization' && (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
        {recipient.type === 'farmer' && (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
        {recipient.type === 'plot' && (
          <Map className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{recipient.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {recipient.country} &bull; {recipient.commodity}
          {recipient.type === 'plot' && recipient.farmerName && (
            <> &bull; {recipient.farmerName}</>
          )}
        </p>
      </div>
      <Badge
        variant="secondary"
        className={cn('shrink-0 text-xs', complianceColors[recipient.complianceStatus])}
      >
        {recipient.complianceStatus === 'non_compliant'
          ? 'Non-Compliant'
          : recipient.complianceStatus.charAt(0).toUpperCase() +
            recipient.complianceStatus.slice(1)}
      </Badge>
      {selected && (
        <Check className="h-4 w-4 shrink-0 text-primary" />
      )}
    </div>
  );
}
