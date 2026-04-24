'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  Calendar,
  TrendingUp,
  Package,
  ShieldCheck,
  MapPin,
  Filter,
  Wallet,
  Users,
} from 'lucide-react';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';

// Mock report data
const reportTypes = [
  {
    id: 'compliance',
    title: 'Compliance Report',
    description: 'Full EUDR compliance status across all packages and plots',
    icon: ShieldCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'package',
    title: 'Package Summary',
    description: 'Overview of DDS packages with submission status',
    icon: Package,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'deforestation',
    title: 'Deforestation Risk',
    description: 'Plot-level deforestation risk assessment breakdown',
    icon: MapPin,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'activity',
    title: 'Activity Log',
    description: 'Detailed audit trail of all system activities',
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
];

const recentReports = [
  { id: 'rpt_001', name: 'Q2 2024 Compliance Report', type: 'compliance', date: '2024-06-20', status: 'completed', size: '2.4 MB' },
  { id: 'rpt_002', name: 'June Package Summary', type: 'package', date: '2024-06-15', status: 'completed', size: '1.2 MB' },
  { id: 'rpt_003', name: 'Deforestation Risk Analysis', type: 'deforestation', date: '2024-06-10', status: 'completed', size: '3.1 MB' },
  { id: 'rpt_004', name: 'Weekly Activity Log', type: 'activity', date: '2024-06-08', status: 'completed', size: '0.8 MB' },
];

const monthlyStats = [
  { month: 'Jan', submitted: 45, approved: 42 },
  { month: 'Feb', submitted: 52, approved: 50 },
  { month: 'Mar', submitted: 48, approved: 46 },
  { month: 'Apr', submitted: 61, approved: 58 },
  { month: 'May', submitted: 55, approved: 53 },
  { month: 'Jun', submitted: 38, approved: 35 },
];

const complianceDistribution = [
  { status: 'Compliant', count: 287, percentage: 72, color: 'bg-green-500' },
  { status: 'Warnings', count: 89, percentage: 22, color: 'bg-amber-500' },
  { status: 'Blocked', count: 24, percentage: 6, color: 'bg-red-500' },
];

interface ImporterSummaryPayload {
  declaration_readiness_rate: number;
  compliant_evidence_records: number;
  shipments_ytd: number;
  reporting_snapshots: number;
  readiness_distribution: {
    compliant: number;
    warnings: number;
    blocked: number;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const isCooperative = user?.active_role === 'cooperative';
  const selectedPeriod = '6months';
  const [cooperativeMetrics, setCooperativeMetrics] = useState({
    total_farmers: 0,
    members_missing_consent: 0,
    total_plots: 0,
    compliant_plots: 0,
    requests_overdue: 0,
    incoming_requests_pending: 0,
    active_campaigns: 0,
    blocking_issues_count: 0,
  });
  const [importerSummary, setImporterSummary] = useState<ImporterSummaryPayload | null>(null);

  useEffect(() => {
    if (!isCooperative) return;
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/insights', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { metrics?: Partial<typeof cooperativeMetrics> }) => {
        if (!payload.metrics) return;
        setCooperativeMetrics((previous) => ({ ...previous, ...payload.metrics }));
      })
      .catch(() => undefined);
  }, [isCooperative]);

  useEffect(() => {
    if (!isImporter) {
      setImporterSummary(null);
      return;
    }
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/reports/importer-summary', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: ImporterSummaryPayload) => {
        if (typeof payload?.declaration_readiness_rate === 'number') {
          setImporterSummary(payload);
        }
      })
      .catch(() => undefined);
  }, [isImporter]);

  const cooperativeDataCompleteness = useMemo(() => {
    if (cooperativeMetrics.total_farmers === 0) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((cooperativeMetrics.total_farmers - cooperativeMetrics.members_missing_consent) /
            cooperativeMetrics.total_farmers) *
            100,
        ),
      ),
    );
  }, [cooperativeMetrics.members_missing_consent, cooperativeMetrics.total_farmers]);

  const cooperativePlotCoverage = useMemo(() => {
    if (cooperativeMetrics.total_plots === 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((cooperativeMetrics.compliant_plots / cooperativeMetrics.total_plots) * 100)),
    );
  }, [cooperativeMetrics.compliant_plots, cooperativeMetrics.total_plots]);

  const cooperativeReadinessDistribution = useMemo(() => {
    const compliant = cooperativeMetrics.compliant_plots;
    const blocked = Math.min(
      cooperativeMetrics.total_plots,
      Math.max(0, cooperativeMetrics.blocking_issues_count),
    );
    const warnings = Math.max(0, cooperativeMetrics.total_plots - compliant - blocked);
    const total = compliant + warnings + blocked;
    if (total === 0) {
      return [
        { status: 'Compliant', count: 0, percentage: 0, color: 'bg-green-500' },
        { status: 'Warnings', count: 0, percentage: 0, color: 'bg-amber-500' },
        { status: 'Blocked', count: 0, percentage: 0, color: 'bg-red-500' },
      ];
    }
    return [
      { status: 'Compliant', count: compliant, percentage: Math.round((compliant / total) * 100), color: 'bg-green-500' },
      { status: 'Warnings', count: warnings, percentage: Math.round((warnings / total) * 100), color: 'bg-amber-500' },
      { status: 'Blocked', count: blocked, percentage: Math.round((blocked / total) * 100), color: 'bg-red-500' },
    ];
  }, [cooperativeMetrics.blocking_issues_count, cooperativeMetrics.compliant_plots, cooperativeMetrics.total_plots]);

  const importerReadinessDistribution = useMemo(() => {
    if (!importerSummary) {
      return complianceDistribution;
    }
    const total = Math.max(
      importerSummary.shipments_ytd,
      importerSummary.readiness_distribution.compliant +
        importerSummary.readiness_distribution.warnings +
        importerSummary.readiness_distribution.blocked,
    );
    return [
      {
        status: 'Compliant',
        count: importerSummary.readiness_distribution.compliant,
        percentage: total > 0 ? Math.round((importerSummary.readiness_distribution.compliant / total) * 100) : 0,
        color: 'bg-green-500',
      },
      {
        status: 'Warnings',
        count: importerSummary.readiness_distribution.warnings,
        percentage: total > 0 ? Math.round((importerSummary.readiness_distribution.warnings / total) * 100) : 0,
        color: 'bg-amber-500',
      },
      {
        status: 'Blocked',
        count: importerSummary.readiness_distribution.blocked,
        percentage: total > 0 ? Math.round((importerSummary.readiness_distribution.blocked / total) * 100) : 0,
        color: 'bg-red-500',
      },
    ];
  }, [importerSummary]);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={isImporter || isCooperative ? 'Reporting' : 'Reports & Analytics'}
        description={
          isImporter
            ? 'Generate annual and operational reporting snapshots with compliance traceability'
            : isCooperative
            ? 'Track cooperative health, premium distribution, and compliance readiness snapshots'
            : 'Generate compliance reports and view analytics'
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              {selectedPeriod === '6months' ? 'Last 6 Months' : selectedPeriod}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                markOnboardingAction('insight_generated');
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isImporter ? 'Generate Snapshot' : 'Generate Report'}
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isCooperative
                      ? `${cooperativeDataCompleteness}%`
                      : isImporter
                        ? `${importerSummary?.declaration_readiness_rate ?? 78}%`
                        : '78%'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCooperative ? 'Member Data Completeness' : isImporter ? 'Declaration Readiness Rate' : 'Compliance Rate'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  {isCooperative ? <Users className="h-5 w-5 text-green-400" /> : <ShieldCheck className="h-5 w-5 text-green-400" />}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isCooperative
                      ? cooperativeMetrics.total_farmers
                      : isImporter
                        ? importerSummary?.compliant_evidence_records ?? 287
                        : '287'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCooperative ? 'Active Members' : isImporter ? 'Compliant Evidence Records' : 'Compliant Plots'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  {isCooperative ? <Wallet className="h-5 w-5 text-blue-400" /> : <Package className="h-5 w-5 text-blue-400" />}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isCooperative
                      ? cooperativeMetrics.active_campaigns
                      : isImporter
                        ? importerSummary?.shipments_ytd ?? 299
                        : '299'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCooperative ? 'Active Campaigns' : isImporter ? 'Shipments (YTD)' : 'Packages (YTD)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  {isCooperative ? <MapPin className="h-5 w-5 text-amber-400" /> : <FileText className="h-5 w-5 text-amber-400" />}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isCooperative
                      ? `${cooperativePlotCoverage}%`
                      : isImporter
                        ? importerSummary?.reporting_snapshots ?? 12
                        : '12'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCooperative ? 'Mapped Plot Coverage' : isImporter ? 'Reporting Snapshots' : 'Reports Generated'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isCooperative ? 'Operational Trend' : isImporter ? 'Declaration Trends' : 'Submission Trends'}
              </CardTitle>
              <CardDescription>
                {isCooperative
                  ? 'Monthly field-capture completion and governance approval cadence'
                  : isImporter
                    ? 'Monthly shipment declaration submissions and outcomes'
                    : 'Monthly package submission and approval rates'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyStats.map((stat) => (
                  <div key={stat.month} className="flex items-center gap-4">
                    <span className="w-8 text-sm text-muted-foreground">{stat.month}</span>
                    <div className="flex-1 h-6 bg-secondary rounded overflow-hidden flex">
                      <div 
                        className="bg-primary/60 h-full"
                        style={{ width: `${(stat.approved / 70) * 100}%` }}
                        title={`Approved: ${stat.approved}`}
                      />
                      <div 
                        className="bg-amber-500/60 h-full"
                        style={{ width: `${((stat.submitted - stat.approved) / 70) * 100}%` }}
                        title={`Pending: ${stat.submitted - stat.approved}`}
                      />
                    </div>
                    <span className="w-20 text-sm text-right">
                      {stat.approved}/{stat.submitted}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/60" />
                  {isCooperative ? 'Completed' : 'Approved'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500/60" />
                  {isCooperative ? 'Outstanding' : 'Pending'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isCooperative ? 'Readiness Distribution' : isImporter ? 'Readiness Distribution' : 'Compliance Distribution'}
              </CardTitle>
              <CardDescription>
                {isCooperative
                  ? 'Breakdown of cooperative readiness status'
                  : isImporter
                    ? 'Breakdown of shipment readiness status'
                    : 'Breakdown of plot compliance status'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(isCooperative
                  ? cooperativeReadinessDistribution
                  : isImporter
                    ? importerReadinessDistribution
                    : complianceDistribution).map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <span className="text-sm font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {isCooperative ? 'Generate Cooperative Reports' : isImporter ? 'Generate Reporting Snapshots' : 'Generate Reports'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className={`w-10 h-10 rounded-lg ${report.bgColor} flex items-center justify-center mb-4`}>
                    <report.icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <h3 className="font-medium mb-1">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Generate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isImporter ? 'Recent Snapshots' : 'Recent Reports'}</CardTitle>
                <CardDescription>
                  {isImporter ? 'Previously generated reporting snapshots' : 'Previously generated reports'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()} · {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {report.type}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
