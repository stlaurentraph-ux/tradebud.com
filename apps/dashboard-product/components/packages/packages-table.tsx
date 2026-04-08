'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ShieldCheck,
  Send,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PackageStatusBadge, ComplianceStatusBadge } from './package-status-badge';
import { PermissionGate } from '@/components/common/permission-gate';
import type { DDSPackage } from '@/types';

interface PackagesTableProps {
  packages: DDSPackage[];
  readOnly?: boolean;
}

export function PackagesTable({ packages, readOnly = false }: PackagesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'code' | 'created_at' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort packages
  const filteredPackages = packages
    .filter((pkg) => {
      const query = searchQuery.toLowerCase();
      return (
        pkg.code.toLowerCase().includes(query) ||
        pkg.supplier_name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">DDS Packages</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort('code')}
                  >
                    Package Code
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Supplier
                </th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Season
                </th>
                <th className="pb-3 pr-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort('status')}
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Compliance
                </th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Plots
                </th>
                <th className="pb-3 pr-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort('created_at')}
                  >
                    Created
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/packages/${pkg.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {pkg.code}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-foreground">{pkg.supplier_name}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-muted-foreground">
                      {pkg.season} {pkg.year}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <PackageStatusBadge status={pkg.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <ComplianceStatusBadge status={pkg.compliance_status} />
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-muted-foreground">{pkg.plots.length}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/packages/${pkg.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <PermissionGate permission="packages:edit">
                          {!readOnly && (
                            <DropdownMenuItem asChild>
                              <Link href={`/packages/${pkg.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Package
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate permission="compliance:run_check">
                          <DropdownMenuItem asChild>
                            <Link href={`/packages/${pkg.id}/compliance`}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Run Compliance Check
                            </Link>
                          </DropdownMenuItem>
                        </PermissionGate>
                        {pkg.status === 'SEALED' && (
                          <PermissionGate permission="packages:submit_traces">
                            <DropdownMenuItem asChild>
                              <Link href={`/packages/${pkg.id}/submit`}>
                                <Send className="mr-2 h-4 w-4" />
                                Submit to TRACES
                              </Link>
                            </DropdownMenuItem>
                          </PermissionGate>
                        )}
                        <DropdownMenuSeparator />
                        {!readOnly && (
                          <PermissionGate permission="packages:delete">
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Package
                            </DropdownMenuItem>
                          </PermissionGate>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPackages.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No packages found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
