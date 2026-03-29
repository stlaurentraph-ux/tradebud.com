'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

// Mock data for reports
const monthlyData = [
  { month: 'Jan', submitted: 45, approved: 42, rejected: 3 },
  { month: 'Feb', submitted: 52, approved: 50, rejected: 2 },
  { month: 'Mar', submitted: 48, approved: 46, rejected: 2 },
  { month: 'Apr', submitted: 61, approved: 58, rejected: 3 },
  { month: 'May', submitted: 55, approved: 53, rejected: 2 },
  { month: 'Jun', submitted: 67, approved: 64, rejected: 3 },
];

const complianceData = [
  { name: 'Compliant', value: 287, color: 'bg-green-500', textColor: 'text-green-600' },
  { name: 'Under Review', value: 45, color: 'bg-amber-500', textColor: 'text-amber-600' },
  { name: 'Non-Compliant', value: 23, color: 'bg-red-500', textColor: 'text-red-600' },
];

const riskData = [
  { risk: 'Low', plots: 156, percentage: 58, color: 'bg-green-500' },
  { risk: 'Medium', plots: 89, percentage: 33, color: 'bg-amber-500' },
  { risk: 'High', plots: 23, percentage: 9, color: 'bg-red-500' },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6months');
  const totalCompliance = complianceData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Reports & Analytics"
        subtitle="Monitor compliance trends and export performance"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="1month">Last 1 Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Exports</p>
              <p className="mt-2 text-3xl font-bold">328</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                12% from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="mt-2 text-3xl font-bold text-green-600">98.2%</p>
              <p className="mt-2 text-xs text-muted-foreground">Consistently high</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Average Processing Time</p>
              <p className="mt-2 text-3xl font-bold">4.2 days</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingDown className="h-3 w-3" />
                1.8 days improvement
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Compliance Score</p>
              <p className="mt-2 text-3xl font-bold text-primary">94%</p>
              <p className="mt-2 text-xs text-muted-foreground">Excellent standing</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Submission Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Submission Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((item) => (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.month}</span>
                      <span className="font-medium">{item.submitted} submitted</span>
                    </div>
                    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                      <div
                        className="bg-green-500"
                        style={{ width: `${(item.approved / item.submitted) * 100}%` }}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${(item.rejected / item.submitted) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Approved
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Rejected
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Compliance Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple donut chart visualization */}
              <div className="flex items-center justify-center py-4">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {complianceData.reduce(
                      (acc, item, index) => {
                        const percentage = (item.value / totalCompliance) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const color =
                          index === 0
                            ? '#22c55e'
                            : index === 1
                              ? '#f59e0b'
                              : '#ef4444';
                        const element = (
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-acc.offset}
                          />
                        );
                        acc.elements.push(element);
                        acc.offset += percentage;
                        return acc;
                      },
                      { elements: [] as React.ReactNode[], offset: 0 }
                    ).elements}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{totalCompliance}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {complianceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded ${item.color}`} />
                      {item.name}
                    </span>
                    <span className="font-medium">
                      {item.value}{' '}
                      <span className="text-muted-foreground">
                        ({Math.round((item.value / totalCompliance) * 100)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deforestation Risk Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Deforestation Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskData.map((item) => (
                  <div key={item.risk} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.risk} Risk</span>
                      <span className="text-muted-foreground">
                        {item.plots} plots ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Export Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Export ID</th>
                    <th className="p-3 text-left font-medium">Package</th>
                    <th className="p-3 text-left font-medium">Submission Date</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Plot Count</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 'EXP-2024-001',
                      pkg: 'Q1 2024 Batch',
                      date: '2024-03-15',
                      status: 'Approved',
                      plots: 45,
                    },
                    {
                      id: 'EXP-2024-002',
                      pkg: 'Q1 2024 Batch 2',
                      date: '2024-03-18',
                      status: 'Approved',
                      plots: 32,
                    },
                    {
                      id: 'EXP-2024-003',
                      pkg: 'Q2 Early Release',
                      date: '2024-03-22',
                      status: 'Under Review',
                      plots: 28,
                    },
                    {
                      id: 'EXP-2024-004',
                      pkg: 'Q2 Standard',
                      date: '2024-03-25',
                      status: 'Submitted',
                      plots: 56,
                    },
                  ].map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium text-primary">{row.id}</td>
                      <td className="p-3">{row.pkg}</td>
                      <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            row.status === 'Approved'
                              ? 'bg-green-500/10 text-green-600'
                              : row.status === 'Under Review'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3">{row.plots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
