'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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
  { name: 'Compliant', value: 287, fill: '#10b981' },
  { name: 'Under Review', value: 45, fill: '#f59e0b' },
  { name: 'Non-Compliant', value: 23, fill: '#ef4444' },
];

const riskData = [
  { risk: 'Low', plots: 156 },
  { risk: 'Medium', plots: 89 },
  { risk: 'High', plots: 23 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6months');

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Monitor compliance trends and export performance</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="1month">Last 1 Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Exports</p>
              <p className="text-3xl font-bold mt-2">328</p>
              <p className="text-xs text-green-600 mt-2">↑ 12% from last period</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">98.2%</p>
              <p className="text-xs text-muted-foreground mt-2">Consistently high</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Average Processing Time</p>
              <p className="text-3xl font-bold mt-2">4.2 days</p>
              <p className="text-xs text-green-600 mt-2">↓ 1.8 days improvement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Compliance Score</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">94%</p>
              <p className="text-xs text-muted-foreground mt-2">Excellent standing</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Submission Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compliance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={complianceData} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {complianceData.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.fill }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{item.value}</span>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="plots" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Export Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Export Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Export ID</th>
                    <th className="text-left p-3 font-medium">Package</th>
                    <th className="text-left p-3 font-medium">Submission Date</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Plot Count</th>
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
                      <td className="p-3 font-medium text-blue-600">{row.id}</td>
                      <td className="p-3">{row.pkg}</td>
                      <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : row.status === 'Under Review'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
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
    </DashboardLayout>
  );
}
