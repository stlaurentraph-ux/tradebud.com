'use client';

import React, { useContext, useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Filter, ChevronRight, MapPin, Send, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlotsDataGuidanceCard } from '@/components/plots/plots-data-guidance-card';
import { PlotMapThumbnail } from '@/components/plots/plot-map-thumbnail';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { LocaleContext } from '@/lib/locale-context';
import {
  getPlotsFieldCaptureColumnLabel,
  getPlotsFiltersLabel,
  getPlotsOriginColumnLabel,
  getPlotsPageSubtitle,
  getPlotsPageTitle,
  getPlotsSearchPlaceholder,
  getPlotsStatHint,
  getPlotsStatLabel,
  getPlotsTableTitle,
} from '@/lib/workflow-terminology-labels';
import { readApiErrorMessage } from '@/lib/api-error-message';
import { listContacts, type ContactRecord } from '@/lib/contact-service';
import { validatePlotCreateInput } from '@/lib/plot-create-validation';
import { useTenantPlots } from '@/lib/use-tenant-plots';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  getPlotInventoryFieldCaptureDetail,
  getPlotInventoryFieldCaptureShortLabel,
  getPlotInventoryRiskDetail,
  getPlotInventoryRiskShortLabel,
  resolvePlotInventoryDisplayRisk,
  resolvePlotInventoryFieldCaptureShort,
  summarizePlotInventory,
  type PlotInventoryDisplayRisk,
  type PlotInventoryFieldCaptureShort,
} from '@/lib/plot-inventory';
import {
  getPlotsCreateDialogFormHeading,
  getPlotsCreateDialogIntro,
  getPlotsCreateDialogProducerGenerateLabel,
  getPlotsCreateDialogProducerHint,
  getPlotsCreateDialogProducerLabel,
  getPlotsCreateDialogProducerPendingSuffix,
  getPlotsCreateDialogProducerSelectPlaceholder,
  getPlotsCreateDialogTitle,
  getPlotsEmptyGuidanceMessage,
  getPlotsRegisterManualCtaLabel,
  getPlotsRequestCtaLabel,
  getPlotsCreateSuccessToast,
  PLOTS_DATA_REQUEST_HREF,
} from '@/lib/plot-create-copy';

const riskBadgeStyles: Record<PlotInventoryDisplayRisk, string> = {
  low: 'text-green-400 bg-green-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  high: 'text-red-400 bg-red-400/10',
  pending: 'text-slate-500 bg-slate-500/10',
};

const fieldCaptureBadgeStyles: Record<PlotInventoryFieldCaptureShort, string> = {
  mapped: 'text-green-400 bg-green-400/10',
  pin_ok: 'text-green-400 bg-green-400/10',
  pin: 'text-amber-400 bg-amber-400/10',
  review: 'text-amber-400 bg-amber-400/10',
  pending: 'text-slate-500 bg-slate-500/10',
};

function InventoryBadge({
  label,
  title,
  className,
}: {
  label: string;
  title: string;
  className: string;
}) {
  const badge = (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );

  if (!title.trim()) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-help rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={title}
        >
          {badge}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  );
}

export default function PlotsPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const { plots, isLoading: isPlotsLoading, error: plotsLoadError, reload: reloadPlots } = useTenantPlots(
    user?.tenant_id ?? null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [producerContacts, setProducerContacts] = useState<ContactRecord[]>([]);
  const [newPlot, setNewPlot] = useState({
    name: '',
    farmerId: '',
    linkedContactId: '',
    producerName: '',
    clientPlotId: '',
    declaredAreaHa: '',
    latitude: '',
    longitude: '',
  });

  const filteredPlots = plots.filter(
    (plot) =>
      plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalArea = plots.reduce((sum, p) => sum + p.area_hectares, 0);
  const plotSummary = summarizePlotInventory(plots);

  useEffect(() => {
    if (!isCreateDialogOpen) return;
    void listContacts()
      .then((contacts) => setProducerContacts(contacts.filter((contact) => contact.contact_type === 'farmer')))
      .catch(() => setProducerContacts([]));
  }, [isCreateDialogOpen]);

  const handleCreatePlot = async () => {
    setCreateError(null);

    const validationError = validatePlotCreateInput(newPlot);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsCreating(true);
    try {
      const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
      const payload = {
        farmerId: newPlot.farmerId.trim(),
        clientPlotId: newPlot.clientPlotId.trim(),
        name: newPlot.name.trim() || newPlot.clientPlotId.trim(),
        ...(newPlot.linkedContactId ? { producerContactId: newPlot.linkedContactId } : {}),
        geometry: {
          type: 'Point',
          coordinates: [Number(newPlot.longitude), Number(newPlot.latitude)],
        },
        declaredAreaHa: Number(newPlot.declaredAreaHa),
      };
      const response = await fetch('/api/plots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, 'Failed to create plot.'));
      }
      markOnboardingAction('first_plot_captured');
      toast.success(getPlotsCreateSuccessToast(t));
      reloadPlots();
      setIsCreateDialogOpen(false);
      setNewPlot({
        name: '',
        farmerId: '',
        linkedContactId: '',
        producerName: '',
        clientPlotId: '',
        declaredAreaHa: '',
        latitude: '',
        longitude: '',
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create plot.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getPlotsPageTitle(t)}
        description={getPlotsPageSubtitle(role, t)}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {getPlotsFiltersLabel(t)}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={PLOTS_DATA_REQUEST_HREF}>
                <Send className="w-4 h-4 mr-2" />
                {getPlotsRequestCtaLabel(t)}
              </Link>
            </Button>
            <PermissionGate permission="plots:bulk_upload">
              <Button variant="outline" size="sm" asChild>
                <Link href="/plots/bulk-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk import
                </Link>
              </Button>
            </PermissionGate>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCreateError(null);
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {getPlotsRegisterManualCtaLabel(t)}
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        <PlotsDataGuidanceCard role={role} t={t} />

        {/* Plots Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getPlotsStatLabel('total', role, t)}</div>
              <div className="text-3xl font-bold mt-2">{plots.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {getPlotsStatHint('total', role, t, { ha: totalArea.toFixed(1) })}
              </p>
            </CardContent>
          </Card>
          <Card className={plotSummary.needs_action > 0 ? 'border-amber-200 bg-amber-50/40' : undefined}>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getPlotsStatLabel('needs_action', role, t)}</div>
              <div className={`text-3xl font-bold mt-2 ${plotSummary.needs_action > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {plotSummary.needs_action}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{getPlotsStatHint('needs_action', role, t)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getPlotsStatLabel('mapped', role, t)}</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{plotSummary.mapped}</div>
              <p className="text-xs text-muted-foreground mt-2">{getPlotsStatHint('mapped', role, t)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getPlotsStatLabel('high', role, t)}</div>
              <div className="text-3xl font-bold text-red-400 mt-2">{plotSummary.high_risk}</div>
              <p className="text-xs text-muted-foreground mt-2">{getPlotsStatHint('high', role, t)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder={getPlotsSearchPlaceholder(role, t)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Plots Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{getPlotsTableTitle(role, t)}</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={200}>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Map</TableHead>
                    <TableHead>Plot Name</TableHead>
                    <TableHead>{getPlotsOriginColumnLabel(role, t)}</TableHead>
                    <TableHead>Area (ha)</TableHead>
                    <TableHead>Deforestation screening</TableHead>
                    <TableHead>{getPlotsFieldCaptureColumnLabel(t)}</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPlotsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        Loading plots…
                      </TableCell>
                    </TableRow>
                  ) : plotsLoadError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-destructive">
                        {plotsLoadError}
                      </TableCell>
                    </TableRow>
                  ) : filteredPlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">{getPlotsEmptyGuidanceMessage(role, t)}</p>
                        <Button asChild size="sm" variant="outline" className="mt-4">
                          <Link href={PLOTS_DATA_REQUEST_HREF}>{getPlotsRequestCtaLabel(t)}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlots.map((plot) => {
                      const displayRisk = resolvePlotInventoryDisplayRisk(plot);
                      const fieldCaptureShort = resolvePlotInventoryFieldCaptureShort(plot);

                      return (
                        <TableRow key={plot.id}>
                          <TableCell>
                            <PlotMapThumbnail plotId={plot.id} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <span className="truncate">{plot.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{plot.farmer_name || 'Unknown'}</TableCell>
                          <TableCell>{plot.area_hectares.toFixed(2)}</TableCell>
                          <TableCell>
                            <InventoryBadge
                              label={getPlotInventoryRiskShortLabel(displayRisk)}
                              title={getPlotInventoryRiskDetail(plot)}
                              className={riskBadgeStyles[displayRisk]}
                            />
                          </TableCell>
                          <TableCell>
                            <InventoryBadge
                              label={getPlotInventoryFieldCaptureShortLabel(fieldCaptureShort)}
                              title={getPlotInventoryFieldCaptureDetail(plot)}
                              className={fieldCaptureBadgeStyles[fieldCaptureShort]}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {plot.evidence.length === 0
                              ? '—'
                              : `${plot.evidence.length} doc${plot.evidence.length !== 1 ? 's' : ''}`}
                          </TableCell>
                          <TableCell>
                            <Link href={`/plots/${plot.id}`}>
                              <Button variant="ghost" size="icon">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{getPlotsCreateDialogTitle(t)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <p>{getPlotsCreateDialogIntro(role, t)}</p>
              <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0 text-amber-950 underline">
                <Link href={PLOTS_DATA_REQUEST_HREF}>{getPlotsRequestCtaLabel(t)}</Link>
              </Button>
            </div>
            <p className="text-sm font-medium text-foreground">{getPlotsCreateDialogFormHeading(t)}</p>
            <div className="space-y-3">
            <div>
              <Label>Plot name</Label>
              <Input value={newPlot.name} onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })} />
            </div>
            <div>
              <Label>{getPlotsCreateDialogProducerLabel(role, t)}</Label>
              {producerContacts.length > 0 ? (
                <select
                  className="mb-2 flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm"
                  value=""
                  onChange={(event) => {
                    const contact = producerContacts.find((item) => item.id === event.target.value);
                    if (!contact) return;
                    setNewPlot((previous) => ({
                      ...previous,
                      linkedContactId: contact.id,
                      producerName: contact.full_name,
                      farmerId: contact.farmer_profile_id ?? (previous.farmerId || crypto.randomUUID()),
                    }));
                  }}
                >
                  <option value="">{getPlotsCreateDialogProducerSelectPlaceholder(role, t)}</option>
                  {producerContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                      {contact.farmer_profile_id ? '' : getPlotsCreateDialogProducerPendingSuffix(t)}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="flex gap-2">
                <Input
                  value={newPlot.farmerId}
                  onChange={(e) => setNewPlot({ ...newPlot, farmerId: e.target.value })}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    setNewPlot((previous) => ({
                      ...previous,
                      farmerId: crypto.randomUUID(),
                    }))
                  }
                >
                  {getPlotsCreateDialogProducerGenerateLabel(role, t)}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {getPlotsCreateDialogProducerHint(role, t)}
              </p>
            </div>
            <div>
              <Label>Client Plot ID</Label>
              <Input value={newPlot.clientPlotId} onChange={(e) => setNewPlot({ ...newPlot, clientPlotId: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Area (ha)</Label>
                <Input value={newPlot.declaredAreaHa} onChange={(e) => setNewPlot({ ...newPlot, declaredAreaHa: e.target.value })} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input value={newPlot.latitude} onChange={(e) => setNewPlot({ ...newPlot, latitude: e.target.value })} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={newPlot.longitude} onChange={(e) => setNewPlot({ ...newPlot, longitude: e.target.value })} />
              </div>
            </div>
            {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreatePlot()} disabled={isCreating}>
              {isCreating ? 'Saving...' : getPlotsRegisterManualCtaLabel(t)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
