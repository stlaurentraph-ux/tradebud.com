'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ChevronRight, User } from 'lucide-react';

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_plots: number;
  total_area_hectares: number;
  compliance_status: 'compliant' | 'non_compliant' | 'partial';
  joined_date: string;
}

interface FarmersTableProps {
  farmers: Farmer[];
}

const complianceColors = {
  compliant: 'text-green-600 bg-green-50',
  non_compliant: 'text-red-600 bg-red-50',
  partial: 'text-yellow-600 bg-yellow-50',
};

const complianceLabels = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  partial: 'Partial',
};

export function FarmersTable({ farmers }: FarmersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Farmers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plots</TableHead>
                <TableHead>Total Area (ha)</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No farmers found
                  </TableCell>
                </TableRow>
              ) : (
                farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {farmer.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{farmer.email}</TableCell>
                    <TableCell className="text-sm">{farmer.phone}</TableCell>
                    <TableCell className="text-center font-medium">{farmer.total_plots}</TableCell>
                    <TableCell>{farmer.total_area_hectares.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded ${complianceColors[farmer.compliance_status]}`}
                      >
                        {complianceLabels[farmer.compliance_status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(farmer.joined_date).toLocaleDateString()}
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
  );
}
