'use client';

import React, { useState } from 'react';
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
import { Plus, Filter, ChevronRight, MapPin, CheckCircle, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { markOnboardingAction } from '@/lib/onboarding-actions';

const riskColors = {
  low: 'text-green-400 bg-green-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  high: 'text-red-400 bg-red-400/10',
  unknown: 'text-slate-500 bg-slate-200/40',
};

const riskLabels = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  unknown: 'Unknown Risk',
};

const RiskIcon = ({ risk }: { risk: 'low' | 'medium' | 'high' | 'unknown' }) => {
  if (risk === 'low') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (risk === 'medium') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (risk === 'high') return <XCircle className="w-4 h-4 text-red-400" />;
  return <AlertCircle className="w-4 h-4 text-slate-500" />;
};

export default function PlotsPage() {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const [plots, setPlots] = useState<Array<{
    id: string;
    name: string;
    farmer_name?: string;
    area_hectares: number;
    deforestation_risk: 'low' | 'medium' | 'high' | 'unknown';
    evidence: unknown[];
    verified: boolean;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlot, setNewPlot] = useState({
    name: '',
    farmerId: '',
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
  const lowRiskCount = plots.filter((p) => p.deforestation_risk === 'low').length;
  const mediumRiskCount = plots.filter((p) => p.deforestation_risk === 'medium').length;
  const highRiskCount = plots.filter((p) => p.deforestation_risk === 'high').length;

  const handleCreatePlot = async () => {
    setCreateError(null);
    setIsCreating(true);
    try {
      const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
      const payload = {
        farmerId: newPlot.farmerId.trim(),
        clientPlotId: newPlot.clientPlotId.trim(),
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
      const body = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to create plot.');
      }
      const createdId = body.id ?? `plot_${Date.now()}`;
      setPlots((previous) => [
        {
          id: createdId,
          name: newPlot.name.trim() || newPlot.clientPlotId.trim(),
          area_hectares: Number(newPlot.declaredAreaHa) || 0,
          farmer_name: user?.name ?? (isCooperative ? 'Member' : 'Producer'),
          deforestation_risk: 'unknown',
          evidence: [],
          verified: false,
        },
        ...previous,
      ]);
      markOnboardingAction('first_plot_captured');
      setIsCreateDialogOpen(false);
      setNewPlot({
        name: '',
        farmerId: '',
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
        title="Plots"
        description={
          isCooperative
            ? 'Track member plot coverage, geometry quality, and compliance risk with field-capture overlays'
            : 'Manage plot inventory and deforestation risk assessments'
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Plot
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Plots Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Plots</div>
              <div className="text-3xl font-bold mt-2">{plots.length}</div>
              <p className="text-xs text-muted-foreground mt-2">{totalArea.toFixed(1)} hectares total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{isCooperative ? 'Mapped & Low Risk' : 'Low Risk'}</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{lowRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">{isCooperative ? 'Ready for batch lineage inclusion' : 'Ready for compliance'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{isCooperative ? 'Needs Field Review' : 'Medium Risk'}</div>
              <div className="text-3xl font-bold text-amber-400 mt-2">{mediumRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">{isCooperative ? 'Geometry/legal checks pending' : 'Requires review'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{isCooperative ? 'Blocked / High Risk' : 'High Risk'}</div>
              <div className="text-3xl font-bold text-red-400 mt-2">{highRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">{isCooperative ? 'Escalate to issues and appeals' : 'Action needed'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder={isCooperative ? 'Search by plot name, ID, or member-linked records...' : 'Search by plot name or ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Plots Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{isCooperative ? 'Plot Registry and Capture Quality' : 'Plot Inventory'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot Name</TableHead>
                    <TableHead>{isCooperative ? 'Member' : 'Producer'}</TableHead>
                    <TableHead>Area (ha)</TableHead>
                    <TableHead>Deforestation Risk</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No plots found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlots.map((plot) => {
                      return (
                        <TableRow key={plot.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {plot.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{plot.farmer_name || 'Unknown'}</TableCell>
                          <TableCell>{plot.area_hectares.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <RiskIcon risk={plot.deforestation_risk} />
                              <span className={`text-xs font-medium px-2 py-1 rounded ${riskColors[plot.deforestation_risk]}`}>
                                {riskLabels[plot.deforestation_risk]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {plot.evidence.length} document{plot.evidence.length !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell>
                            {plot.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            )}
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
          </CardContent>
        </Card>
      </main>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create plot</DialogTitle>
            <DialogDescription>Creates a real plot record via backend `/v1/plots`.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Plot name</Label>
              <Input value={newPlot.name} onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })} />
            </div>
            <div>
              <Label>{isCooperative ? 'Member ID (UUID)' : 'Producer ID (UUID)'}</Label>
              <Input value={newPlot.farmerId} onChange={(e) => setNewPlot({ ...newPlot, farmerId: e.target.value })} />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreatePlot()} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create plot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
