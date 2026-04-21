'use client';

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
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Run ID or Questionnaire..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 h-9"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value as RunQueueFilters['status'])}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Run Type Filter */}
        <Select
          value={filters.runType}
          onValueChange={(value) => updateFilter('runType', value as RunQueueFilters['runType'])}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
            <SelectItem value="scoring">Scoring</SelectItem>
          </SelectContent>
        </Select>

        {/* Claim Status Filter */}
        <Select
          value={filters.claimStatus}
          onValueChange={(value) =>
            updateFilter('claimStatus', value as RunQueueFilters['claimStatus'])
          }
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Claims" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Claims</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="unclaimed">Unclaimed</SelectItem>
          </SelectContent>
        </Select>

        {/* Due Now Toggle */}
        <Button
          variant={filters.dueNow ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('dueNow', !filters.dueNow)}
          className={cn(
            'h-9',
            filters.dueNow && 'bg-amber-600 hover:bg-amber-700 text-white'
          )}
        >
          Due Now
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Count & Active Filters Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <Filter className="h-3.5 w-3.5" />
              <span>
                Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
                {totalCount} runs
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </>
          ) : (
            <span>
              <span className="font-medium text-foreground">{totalCount}</span> total runs
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
