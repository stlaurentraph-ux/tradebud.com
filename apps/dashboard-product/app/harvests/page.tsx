'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, AlertCircle, CheckCircle, Truck, MapPin, MessageSquare } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGate } from '@/components/common/permission-gate';
import { cn } from '@/lib/utils';

interface Harvest {
  id: string;
  batch_id: string;
  plot_id: string;
  plot_name: string;
  plot_area_hectares: number;
  farmer_name: string;
  weight_kg: number;
  expected_yield_kg_per_ha: number;
  date: string;
  status: 'pass' | 'warning' | 'blocked';
  exception_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

const mockHarvests: Harvest[] = [];

function getStatusBadge(status: 'pass' | 'warning' | 'blocked') {
  const config = {
    pass: {
      icon: CheckCircle,
      color: 'bg-emerald-500/20 text-emerald-600',
      label: 'Pass',
    },
    warning: {
      icon: AlertCircle,
      color: 'bg-amber-500/20 text-amber-600',
      label: 'Warning: Above Capacity',
    },
    blocked: {
      icon: AlertCircle,
      color: 'bg-destructive/20 text-destructive',
      label: 'Blocked: Excess Weight',
    },
  };
  const { icon: Icon, color, label } = config[status];
  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function calculateYieldCap(area: number, expectedYield: number): number {
  return area * expectedYield;
}

export default function HarvestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pass' | 'warning' | 'blocked'>('all');
  const [harvests, setHarvests] = useState<Harvest[]>(mockHarvests);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [exceptionNotes, setExceptionNotes] = useState('');

  const filteredHarvests = harvests.filter((h) => {
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    const query = searchQuery.toLowerCase();
    return h.batch_id.toLowerCase().includes(query) || 
           h.plot_name.toLowerCase().includes(query) ||
           h.farmer_name.toLowerCase().includes(query);
  });

  const totalBatches = harvests.length;
  const totalWeight = harvests.reduce((sum, h) => sum + h.weight_kg, 0);
  const totalArea = harvests.reduce((sum, h) => sum + h.plot_area_hectares, 0);
  const avgYield = totalArea > 0 ? totalWeight / totalArea : 0;
  const flaggedBatches = harvests.filter((h) => h.status !== 'pass').length;

  const handleRequestException = () => {
    if (!selectedHarvest) return;

    setHarvests(
      harvests.map((h) =>
        h.id === selectedHarvest.id
          ? { ...h, exception_status: 'pending' }
          : h
      )
    );
    setExceptionDialogOpen(false);
    setSelectedHarvest(null);
    setExceptionNotes('');
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Harvests & Batches"
        subtitle="Track Identity-Preserved harvests with yield-cap validation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Harvests' },
        ]}
        actions={
          <PermissionGate permission="harvests:create">
            <Button asChild>
              <Link href="/harvests/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Harvest
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold mt-1">{totalBatches}</p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-2xl font-bold mt-1">{(totalWeight / 1000).toFixed(1)} t</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Yield/Ha</p>
                  <p className="text-2xl font-bold mt-1">{avgYield.toFixed(0)} kg</p>
                </div>
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Batches</p>
                  <p className={cn('text-2xl font-bold mt-1', flaggedBatches > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {flaggedBatches}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Input
                placeholder="Search by batch ID, plot, or farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {(['all', 'pass', 'warning', 'blocked'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize"
                  >
                    {status === 'all' ? 'All' : status === 'pass' ? 'Pass' : status === 'warning' ? 'Warning' : 'Blocked'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvests Table */}
        <Card>
          <CardContent className="pt-6">
            {filteredHarvests.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No harvests match your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Batch ID
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Plot
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Farmer
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Weight (kg)
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Capacity (kg)
                      </th>
                      <th className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHarvests.map((harvest) => {
                      const capacity = calculateYieldCap(harvest.plot_area_hectares, harvest.expected_yield_kg_per_ha);
                      return (
                        <tr
                          key={harvest.id}
                          className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                        >
                          <td className="py-3 pr-4">
                            <Link
                              href={`/harvests/${harvest.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {harvest.batch_id}
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-foreground">{harvest.plot_name}</span>
                            <p className="text-xs text-muted-foreground">{harvest.plot_area_hectares} ha</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-foreground">{harvest.farmer_name}</span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <span className="text-sm font-medium">{harvest.weight_kg.toLocaleString()}</span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <span className="text-sm text-muted-foreground">{capacity.toLocaleString()}</span>
                          </td>
                          <td className="py-3 pr-4">
                            {getStatusBadge(harvest.status)}
                          </td>
                          <td className="py-3">
                            <span className="text-sm text-muted-foreground">
                              {new Date(harvest.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3">
                            {(harvest.status === 'warning' || harvest.status === 'blocked') && (
                              <Dialog open={exceptionDialogOpen && selectedHarvest?.id === harvest.id} onOpenChange={(open) => {
                                if (open) {
                                  setSelectedHarvest(harvest);
                                  setExceptionDialogOpen(true);
                                } else {
                                  setExceptionDialogOpen(false);
                                  setSelectedHarvest(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedHarvest(harvest);
                                      setExceptionDialogOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {harvest.exception_status === 'pending' ? 'Pending' : 'Request'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Request Yield Exception</DialogTitle>
                                    <DialogDescription>
                                      Request an exception for {harvest.batch_id} ({harvest.farmer_name})
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                                      <div className="font-medium">Current Status</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {harvest.status === 'warning' 
                                          ? `Warning: ${harvest.weight_kg.toLocaleString()} kg (1.0-1.1x capacity)` 
                                          : `Blocked: ${harvest.weight_kg.toLocaleString()} kg (>1.1x capacity)`}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Justification</Label>
                                      <Textarea
                                        placeholder="Explain the exceptional circumstances (e.g., favorable weather, equipment efficiency)..."
                                        value={exceptionNotes}
                                        onChange={(e) => setExceptionNotes(e.target.value)}
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setExceptionDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleRequestException}>
                                        Submit Exception Request
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yield Cap Warning Info */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">
                  Yield Cap Validation
                </p>
                <p className="text-amber-800 mt-1">
                  Each harvest is cross-referenced against the plot&apos;s biological carrying capacity (plot area × expected yield). 
                  Weights above capacity trigger warnings or blocks to prevent illicit blending or laundering.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
