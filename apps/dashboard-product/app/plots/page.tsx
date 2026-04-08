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
import { Plus, Filter, ChevronRight, MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getMockPlots, getFarmerById } from '@/lib/mock-data';
import Link from 'next/link';

const riskColors = {
  low: 'text-green-400 bg-green-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  high: 'text-red-400 bg-red-400/10',
};

const riskLabels = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

const RiskIcon = ({ risk }: { risk: 'low' | 'medium' | 'high' }) => {
  if (risk === 'low') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (risk === 'medium') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
};

export default function PlotsPage() {
  const plots = getMockPlots();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlots = plots.filter(
    (plot) =>
      plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalArea = plots.reduce((sum, p) => sum + p.area_hectares, 0);
  const lowRiskCount = plots.filter((p) => p.deforestation_risk === 'low').length;
  const mediumRiskCount = plots.filter((p) => p.deforestation_risk === 'medium').length;
  const highRiskCount = plots.filter((p) => p.deforestation_risk === 'high').length;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Plots"
        description="Manage plot inventory and deforestation risk assessments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
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
              <div className="text-sm font-medium text-muted-foreground">Low Risk</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{lowRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Ready for compliance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Medium Risk</div>
              <div className="text-3xl font-bold text-amber-400 mt-2">{mediumRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Requires review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">High Risk</div>
              <div className="text-3xl font-bold text-red-400 mt-2">{highRiskCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Action needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder="Search by plot name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Plots Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plot Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot Name</TableHead>
                    <TableHead>Farmer</TableHead>
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
                      const farmer = getFarmerById(plot.farmer_id);
                      return (
                        <TableRow key={plot.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {plot.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{farmer?.name || 'Unknown'}</TableCell>
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
    </div>
  );
}
