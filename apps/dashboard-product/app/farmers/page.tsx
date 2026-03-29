'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FarmersTable } from '@/components/plots/farmers-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { getMockFarmers } from '@/lib/mock-data';

export default function FarmersPage() {
  const farmers = getMockFarmers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Farmers Management">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Farmers</h1>
            <p className="text-muted-foreground mt-1">Manage farmer accounts and their plot portfolios</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Farmer
            </Button>
          </div>
        </div>

        {/* Farmers Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Farmers</div>
              <div className="text-3xl font-bold mt-2">{farmers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Active in system</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Compliant</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {farmers.filter((f) => f.compliance_status === 'compliant').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">All plots verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Partial Compliance</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">
                {farmers.filter((f) => f.compliance_status === 'partial').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Some plots pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Area</div>
              <div className="text-3xl font-bold mt-2">
                {farmers.reduce((sum, f) => sum + f.total_area_hectares, 0).toFixed(0)} ha
              </div>
              <p className="text-xs text-muted-foreground mt-2">Managed portfolio</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              placeholder="Search by farmer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Farmers Table */}
        <FarmersTable farmers={filteredFarmers} />
      </div>
    </DashboardLayout>
  );
}
