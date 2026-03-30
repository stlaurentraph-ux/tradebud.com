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
import { Plus, Filter, ChevronRight, User, CheckCircle, AlertCircle } from 'lucide-react';
import { getMockFarmersWithStats } from '@/lib/mock-data';
import Link from 'next/link';

const complianceColors = {
  compliant: 'text-green-400 bg-green-400/10',
  non_compliant: 'text-red-400 bg-red-400/10',
  partial: 'text-yellow-400 bg-yellow-400/10',
};

const complianceLabels = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  partial: 'Partial',
};

export default function FarmersPage() {
  const farmers = getMockFarmersWithStats();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.cooperative.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const compliantCount = farmers.filter((f) => f.compliance_status === 'compliant').length;
  const partialCount = farmers.filter((f) => f.compliance_status === 'partial').length;
  const totalArea = farmers.reduce((sum, f) => sum + f.total_area_hectares, 0);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Farmers"
        description="Manage farmer accounts and their plot portfolios"
        actions={
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
        }
      />

      <main className="flex-1 p-6 space-y-6">
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
              <div className="text-3xl font-bold text-green-400 mt-2">{compliantCount}</div>
              <p className="text-xs text-muted-foreground mt-2">All requirements met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Partial Compliance</div>
              <div className="text-3xl font-bold text-yellow-400 mt-2">{partialCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Some requirements pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Area</div>
              <div className="text-3xl font-bold mt-2">{totalArea.toFixed(1)} ha</div>
              <p className="text-xs text-muted-foreground mt-2">Managed portfolio</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder="Search by farmer name or cooperative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Farmers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Cooperative</TableHead>
                    <TableHead className="text-center">Plots</TableHead>
                    <TableHead>Area (ha)</TableHead>
                    <TableHead>FPIC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No farmers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFarmers.map((farmer) => (
                      <TableRow key={farmer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {farmer.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{farmer.phone}</TableCell>
                        <TableCell className="text-sm">{farmer.cooperative}</TableCell>
                        <TableCell className="text-center font-medium">{farmer.total_plots}</TableCell>
                        <TableCell>{farmer.total_area_hectares.toFixed(2)}</TableCell>
                        <TableCell>
                          {farmer.fpic_signed ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${complianceColors[farmer.compliance_status]}`}
                          >
                            {complianceLabels[farmer.compliance_status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/farmers/${farmer.id}`}>
                            <Button variant="ghost" size="icon">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
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
