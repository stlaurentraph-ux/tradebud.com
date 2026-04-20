'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PlotStatusBadge } from './plot-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ChevronRight, MapPin } from 'lucide-react';

interface Plot {
  id: string;
  name: string;
  location: string;
  area_hectares: number;
  deforestation_risk: 'low' | 'medium' | 'high';
  status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_verification';
  farmer_id: string;
  farmer_name: string;
  last_assessment: string;
}

interface PlotsTableProps {
  plots: Plot[];
}

const riskColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

const riskLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function PlotsTable({ plots }: PlotsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Plots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Area (ha)</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Deforestation Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No plots found
                  </TableCell>
                </TableRow>
              ) : (
                plots.map((plot) => (
                  <TableRow key={plot.id}>
                    <TableCell className="font-medium">{plot.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {plot.location}
                      </div>
                    </TableCell>
                    <TableCell>{plot.area_hectares.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{plot.farmer_name}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${riskColors[plot.deforestation_risk]}`}>
                        {riskLabels[plot.deforestation_risk]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PlotStatusBadge status={plot.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(plot.last_assessment).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/plots/${plot.id}`}>
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
  );
}
