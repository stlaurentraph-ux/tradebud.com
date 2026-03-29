// Core user and tenant types
export type TenantRole = 'exporter' | 'importer' | 'cooperative' | 'country_reviewer';

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  roles: TenantRole[];
  active_role: TenantRole;
  avatar_url?: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantRole;
  country: string;
  created_at: string;
}

// Package types
export type PackageStatus = 
  | 'draft'
  | 'in_review'
  | 'preflight_check'
  | 'traces_ready'
  | 'submitted'
  | 'approved'
  | 'rejected';

export interface DDSPackage {
  id: string;
  code: string;
  supplier_name: string;
  season: string;
  year: number;
  status: PackageStatus;
  compliance_status: ComplianceStatus;
  plots: Plot[];
  farmers: Farmer[];
  tenant_id: string;
  created_by: string;
  traces_reference?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

// Plot types
export type DeforestationRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface Plot {
  id: string;
  name: string;
  package_id?: string;
  farmer_id: string;
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  area_hectares: number;
  deforestation_risk: DeforestationRisk;
  evidence: Evidence[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// Farmer types
export interface Farmer {
  id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  cooperative_id?: string;
  plots: Plot[];
  verified: boolean;
  fpic_signed: boolean;
  labor_compliant: boolean;
  created_at: string;
  updated_at: string;
}

// Compliance types
export type ComplianceStatus = 'passed' | 'warnings' | 'blocked' | 'pending';

export type EvidenceType = 
  | 'satellite_imagery'
  | 'gps_coordinates'
  | 'farmer_affidavit'
  | 'fpic_document'
  | 'labor_certificate'
  | 'cooperative_validation';

export interface Evidence {
  id: string;
  type: EvidenceType;
  plot_id: string;
  file_url?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
}

export interface ComplianceCheck {
  id: string;
  package_id: string;
  plot_id: string;
  deforestation_status: DeforestationRisk;
  evidence_complete: boolean;
  blocking_issues: BlockingIssue[];
  passed: boolean;
  checked_at: string;
  checked_by: string;
}

export interface BlockingIssue {
  id: string;
  type: 'deforestation_risk' | 'missing_evidence' | 'farmer_verification' | 'fpic_missing' | 'labor_compliance';
  severity: 'warning' | 'blocking';
  message: string;
  remediation: string;
  plot_id?: string;
  farmer_id?: string;
}

export interface PreflightResult {
  package_id: string;
  overall_status: ComplianceStatus;
  total_plots: number;
  passed_plots: number;
  warning_plots: number;
  blocked_plots: number;
  blocking_issues: BlockingIssue[];
  warnings: BlockingIssue[];
  ready_for_traces: boolean;
  checked_at: string;
}

// Report types
export interface Report {
  id: string;
  package_id: string;
  type: 'compliance' | 'submission' | 'audit';
  file_url: string;
  generated_at: string;
  generated_by: string;
}

// Activity types
export type ActivityType = 
  | 'package_created'
  | 'package_updated'
  | 'package_submitted'
  | 'plot_added'
  | 'compliance_check'
  | 'document_uploaded'
  | 'traces_submission';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entity_id: string;
  entity_type: 'package' | 'plot' | 'farmer' | 'report';
  user_id: string;
  user_name: string;
  created_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  total_packages: number;
  total_plots: number;
  total_farmers: number;
  pending_compliance: number;
  traces_submitted: number;
  compliance_rate: number;
  packages_by_status: Record<PackageStatus, number>;
  recent_activity: Activity[];
}
