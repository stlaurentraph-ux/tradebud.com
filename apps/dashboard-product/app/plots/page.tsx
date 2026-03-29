'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PlotsTable } from '@/components/plots/plots-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { getMockPlots } from '@/lib/mock-data';

export default function PlotsPage() {
  const plots = getMockPlots();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlots = plots.filter(
    (plot) =>
      plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Plots Management">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plots</h1>
            <p className="text-muted-foreground mt-1">Manage and monitor your plots and deforestation compliance</p>
          </div>
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
        </div>

        {/* Plots Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Plots</div>
              <div className="text-3xl font-bold mt-2">{plots.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Across all farmers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Compliant</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {plots.filter((p) => p.status === 'compliant').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ready for submission</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">At Risk</div>
              <div className="text-3xl font-bold text-red-600 mt-2">
                {plots.filter((p) => p.status === 'non_compliant').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Area</div>
              <div className="text-3xl font-bold mt-2">
                {plots.reduce((sum, p) => sum + p.area_hectares, 0).toFixed(0)} ha
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across portfolio</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Plots</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              placeholder="Search by plot name, location, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Plots Table */}
        <PlotsTable plots={filteredPlots} />
      </div>
    </DashboardLayout>
  );
}
