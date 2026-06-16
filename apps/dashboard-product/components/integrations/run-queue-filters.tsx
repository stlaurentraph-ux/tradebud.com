'use client';

import { useContext } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RunQueueFilters } from '@/types/integrations';
import { LocaleContext } from '@/lib/locale-context';
import {
  getIntegrationsFilterActiveCountLabel,
  getIntegrationsFilterClearSearchLabel,
  getIntegrationsFilterOptionLabel,
  getIntegrationsFilterResultsLabel,
  getIntegrationsFilterSearchPlaceholder,
  getIntegrationsFilterTotalRunsLabel,
} from '@/lib/workflow-terminology-labels';

interface RunQueueFiltersProps {
  filters: RunQueueFilters;
  onFiltersChange: (filters: RunQueueFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export function RunQueueFiltersBar({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: RunQueueFiltersProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  const updateFilter = <K extends keyof RunQueueFilters>(
    key: K,
    value: RunQueueFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      runType: 'all',
      claimStatus: 'all',
      dueNow: false,
      search: '',
    });
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.runType !== 'all' ||
    filters.claimStatus !== 'all' ||
    filters.dueNow ||
    filters.search.length > 0;

  const activeFilterCount = [
    filters.status !== 'all',
    filters.runType !== 'all',
    filters.claimStatus !== 'all',
    filters.dueNow,
    filters.search.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={getIntegrationsFilterSearchPlaceholder(t)}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 h-9"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={getIntegrationsFilterClearSearchLabel(t)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value as RunQueueFilters['status'])}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder={getIntegrationsFilterOptionLabel('status', t)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getIntegrationsFilterOptionLabel('all_statuses', t)}</SelectItem>
            <SelectItem value="started">{getIntegrationsFilterOptionLabel('started', t)}</SelectItem>
            <SelectItem value="completed">{getIntegrationsFilterOptionLabel('completed', t)}</SelectItem>
            <SelectItem value="failed">{getIntegrationsFilterOptionLabel('failed', t)}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.runType}
          onValueChange={(value) => updateFilter('runType', value as RunQueueFilters['runType'])}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder={getIntegrationsFilterOptionLabel('type', t)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getIntegrationsFilterOptionLabel('all_types', t)}</SelectItem>
            <SelectItem value="validation">{getIntegrationsFilterOptionLabel('validation', t)}</SelectItem>
            <SelectItem value="scoring">{getIntegrationsFilterOptionLabel('scoring', t)}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.claimStatus}
          onValueChange={(value) =>
            updateFilter('claimStatus', value as RunQueueFilters['claimStatus'])
          }
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder={getIntegrationsFilterOptionLabel('claims', t)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getIntegrationsFilterOptionLabel('all_claims', t)}</SelectItem>
            <SelectItem value="claimed">{getIntegrationsFilterOptionLabel('claimed', t)}</SelectItem>
            <SelectItem value="unclaimed">{getIntegrationsFilterOptionLabel('unclaimed', t)}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={filters.dueNow ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('dueNow', !filters.dueNow)}
          className={cn(
            'h-9',
            filters.dueNow && 'bg-amber-600 hover:bg-amber-700 text-white'
          )}
        >
          {getIntegrationsFilterOptionLabel('due_now', t)}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            {getIntegrationsFilterOptionLabel('clear', t)}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <Filter className="h-3.5 w-3.5" />
              <span>{getIntegrationsFilterResultsLabel(filteredCount, totalCount, t)}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getIntegrationsFilterActiveCountLabel(activeFilterCount, t)}
                </Badge>
              )}
            </>
          ) : (
            <span>{getIntegrationsFilterTotalRunsLabel(totalCount, t)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
