import type {
  DDSPackage,
  Plot,
  Farmer,
  Activity,
  DashboardMetrics,
  ComplianceCheck,
  BlockingIssue,
  PreflightResult,
} from '@/types';

// Mock Farmers
export const mockFarmers: Farmer[] = [
  {
    id: 'farmer_001',
    name: 'Jean-Baptiste Niyonzima',
    contact_phone: '+250 788 123 456',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'farmer_002',
    name: 'Marie Uwimana',
    contact_phone: '+250 788 234 567',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'farmer_003',
    name: 'Pierre Habimana',
    contact_phone: '+250 788 345 678',
    cooperative_id: 'coop_002',
    plots: [],
    verified: false,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
  {
    id: 'farmer_004',
    name: 'Esperance Mukamana',
    contact_phone: '+250 788 456 789',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: false,
    labor_compliant: true,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
  },
  {
    id: 'farmer_005',
    name: 'Emmanuel Nsabimana',
    contact_phone: '+250 788 567 890',
    cooperative_id: 'coop_002',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: false,
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-06-12T00:00:00Z',
  },
];

// Mock Plots
export const mockPlots: Plot[] = [
  {
    id: 'plot_001',
    name: 'Kigali Highland Plot A',
    package_id: 'pkg_001',
    farmer_id: 'farmer_001',
    area_hectares: 2.5,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_001', type: 'satellite_imagery', plot_id: 'plot_001', verified: true, created_at: '2024-05-01T00:00:00Z' },
      { id: 'ev_002', type: 'gps_coordinates', plot_id: 'plot_001', verified: true, created_at: '2024-05-01T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'plot_002',
    name: 'Musanze Valley Farm',
    package_id: 'pkg_001',
    farmer_id: 'farmer_002',
    area_hectares: 1.8,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_003', type: 'satellite_imagery', plot_id: 'plot_002', verified: true, created_at: '2024-05-02T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-06-05T00:00:00Z',
  },
  {
    id: 'plot_003',
    name: 'Huye Mountain Terrace',
    package_id: 'pkg_002',
    farmer_id: 'farmer_003',
    area_hectares: 3.2,
    deforestation_risk: 'medium',
    evidence: [
      { id: 'ev_004', type: 'gps_coordinates', plot_id: 'plot_003', verified: true, created_at: '2024-05-10T00:00:00Z' },
    ],
    verified: false,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'plot_004',
    name: 'Nyagatare Eastern Farm',
    package_id: 'pkg_002',
    farmer_id: 'farmer_004',
    area_hectares: 4.1,
    deforestation_risk: 'high',
    evidence: [],
    verified: true,
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'plot_005',
    name: 'Rubavu Lake View',
    package_id: 'pkg_003',
    farmer_id: 'farmer_005',
    area_hectares: 2.0,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_005', type: 'satellite_imagery', plot_id: 'plot_005', verified: true, created_at: '2024-05-20T00:00:00Z' },
      { id: 'ev_006', type: 'farmer_affidavit', plot_id: 'plot_005', verified: true, created_at: '2024-05-21T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
];

// Mock DDS Packages
export const mockPackages: DDSPackage[] = [
  {
    id: 'pkg_001',
    code: 'DDS-2024-001',
    supplier_name: 'Rwanda Coffee Cooperative',
    season: 'A',
    year: 2024,
    status: 'traces_ready',
    compliance_status: 'passed',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_001'),
    farmers: mockFarmers.slice(0, 2),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'pkg_002',
    code: 'DDS-2024-002',
    supplier_name: 'Huye Highland Growers',
    season: 'A',
    year: 2024,
    status: 'preflight_check',
    compliance_status: 'warnings',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_002'),
    farmers: mockFarmers.slice(2, 4),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
  {
    id: 'pkg_003',
    code: 'DDS-2024-003',
    supplier_name: 'Lake Kivu Farms',
    season: 'B',
    year: 2024,
    status: 'submitted',
    compliance_status: 'passed',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_003'),
    farmers: mockFarmers.slice(4),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    traces_reference: 'TRACES-EU-2024-RW-0042',
    submitted_at: '2024-06-10T00:00:00Z',
    created_at: '2024-05-20T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'pkg_004',
    code: 'DDS-2024-004',
    supplier_name: 'Northern Province Collective',
    season: 'B',
    year: 2024,
    status: 'draft',
    compliance_status: 'pending',
    plots: [],
    farmers: [],
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
  },
  {
    id: 'pkg_005',
    code: 'DDS-2024-005',
    supplier_name: 'Eastern Province Union',
    season: 'B',
    year: 2024,
    status: 'in_review',
    compliance_status: 'pending',
    plots: [],
    farmers: [],
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-06-05T00:00:00Z',
    updated_at: '2024-06-22T00:00:00Z',
  },
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: 'act_001',
    type: 'package_submitted',
    title: 'TRACES Submission',
    description: 'DDS-2024-003 submitted to TRACES',
    entity_id: 'pkg_003',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-22T14:30:00Z',
  },
  {
    id: 'act_002',
    type: 'compliance_check',
    title: 'Pre-flight Check',
    description: 'DDS-2024-002 compliance check completed with warnings',
    entity_id: 'pkg_002',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-22T10:15:00Z',
  },
  {
    id: 'act_003',
    type: 'plot_added',
    title: 'Plot Added',
    description: 'Rubavu Lake View plot added to DDS-2024-003',
    entity_id: 'plot_005',
    entity_type: 'plot',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-21T16:45:00Z',
  },
  {
    id: 'act_004',
    type: 'document_uploaded',
    title: 'Evidence Uploaded',
    description: 'Satellite imagery uploaded for Kigali Highland Plot A',
    entity_id: 'plot_001',
    entity_type: 'plot',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-20T09:00:00Z',
  },
  {
    id: 'act_005',
    type: 'package_created',
    title: 'Package Created',
    description: 'DDS-2024-005 created for Eastern Province Union',
    entity_id: 'pkg_005',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-19T11:30:00Z',
  },
];

// Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  total_packages: mockPackages.length,
  total_plots: mockPlots.length,
  total_farmers: mockFarmers.length,
  pending_compliance: mockPackages.filter((p) => p.compliance_status === 'pending' || p.compliance_status === 'warnings').length,
  traces_submitted: mockPackages.filter((p) => p.status === 'submitted' || p.status === 'approved').length,
  compliance_rate: 78,
  packages_by_status: {
    draft: mockPackages.filter((p) => p.status === 'draft').length,
    in_review: mockPackages.filter((p) => p.status === 'in_review').length,
    preflight_check: mockPackages.filter((p) => p.status === 'preflight_check').length,
    traces_ready: mockPackages.filter((p) => p.status === 'traces_ready').length,
    submitted: mockPackages.filter((p) => p.status === 'submitted').length,
    approved: mockPackages.filter((p) => p.status === 'approved').length,
    rejected: mockPackages.filter((p) => p.status === 'rejected').length,
  },
  recent_activity: mockActivities,
};

// Mock Compliance Checks
export const mockComplianceChecks: ComplianceCheck[] = [
  {
    id: 'cc_001',
    package_id: 'pkg_001',
    plot_id: 'plot_001',
    deforestation_status: 'low',
    evidence_complete: true,
    blocking_issues: [],
    passed: true,
    checked_at: '2024-06-15T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
  {
    id: 'cc_002',
    package_id: 'pkg_002',
    plot_id: 'plot_003',
    deforestation_status: 'medium',
    evidence_complete: false,
    blocking_issues: [
      {
        id: 'bi_001',
        type: 'missing_evidence',
        severity: 'warning',
        message: 'Satellite imagery not yet uploaded',
        remediation: 'Upload satellite imagery from approved provider',
        plot_id: 'plot_003',
      },
    ],
    passed: false,
    checked_at: '2024-06-20T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
  {
    id: 'cc_003',
    package_id: 'pkg_002',
    plot_id: 'plot_004',
    deforestation_status: 'high',
    evidence_complete: false,
    blocking_issues: [
      {
        id: 'bi_002',
        type: 'deforestation_risk',
        severity: 'blocking',
        message: 'High deforestation risk detected',
        remediation: 'Provide additional evidence or exclude plot from package',
        plot_id: 'plot_004',
      },
      {
        id: 'bi_003',
        type: 'missing_evidence',
        severity: 'blocking',
        message: 'No evidence documents uploaded',
        remediation: 'Upload required evidence documents',
        plot_id: 'plot_004',
      },
      {
        id: 'bi_004',
        type: 'fpic_missing',
        severity: 'blocking',
        message: 'FPIC document not signed by farmer',
        remediation: 'Obtain signed FPIC consent from farmer',
        farmer_id: 'farmer_004',
      },
    ],
    passed: false,
    checked_at: '2024-06-20T00:00:00Z',
    checked_by: 'usr_exporter_001',
  },
];

// Mock Preflight Results
export function getPreflightResult(packageId: string): PreflightResult | null {
  const pkg = mockPackages.find((p) => p.id === packageId);
  if (!pkg) return null;

  const checks = mockComplianceChecks.filter((c) => c.package_id === packageId);
  const blockingIssues: BlockingIssue[] = [];
  const warnings: BlockingIssue[] = [];

  for (const check of checks) {
    for (const issue of check.blocking_issues) {
      if (issue.severity === 'blocking') {
        blockingIssues.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  const passedPlots = checks.filter((c) => c.passed).length;
  const blockedPlots = checks.filter((c) => c.blocking_issues.some((i) => i.severity === 'blocking')).length;
  const warningPlots = checks.filter(
    (c) => !c.passed && !c.blocking_issues.some((i) => i.severity === 'blocking')
  ).length;

  return {
    package_id: packageId,
    overall_status: blockedPlots > 0 ? 'blocked' : warningPlots > 0 ? 'warnings' : 'passed',
    total_plots: checks.length,
    passed_plots: passedPlots,
    warning_plots: warningPlots,
    blocked_plots: blockedPlots,
    blocking_issues: blockingIssues,
    warnings,
    ready_for_traces: blockedPlots === 0,
    checked_at: new Date().toISOString(),
  };
}

// Get package by ID
export function getPackageById(id: string): DDSPackage | undefined {
  return mockPackages.find((p) => p.id === id);
}

// Get farmer by ID
export function getFarmerById(id: string): Farmer | undefined {
  return mockFarmers.find((f) => f.id === id);
}

// Get plot by ID
export function getPlotById(id: string): Plot | undefined {
  return mockPlots.find((p) => p.id === id);
}
