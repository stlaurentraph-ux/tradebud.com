// ============================================================
// CANONICAL LEGAL WORKFLOW ROLES (Section 5 of TRACEBUD_V1_2_EUDR_SPEC)
// Legal role is determined PER WORKFLOW, never as a static organisation label
// ============================================================

export type LegalWorkflowRole =
  | 'OUT_OF_SCOPE'
  | 'OPERATOR'
  | 'MICRO_SMALL_PRIMARY_OPERATOR'
  | 'DOWNSTREAM_OPERATOR_FIRST'
  | 'DOWNSTREAM_OPERATOR_SUBSEQUENT'
  | 'TRADER'
  | 'PENDING_MANUAL_CLASSIFICATION';

// ============================================================
// COMMERCIAL TIER MODEL (Section 3 of TRACEBUD_V1_2_EUDR_SPEC)
// Controls pricing, permissions, support, sponsorship - NOT an EUDR legal role
// ============================================================

export type CommercialTier = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';

export interface CommercialTierConfig {
  tier: CommercialTier;
  name: string;
  persona: string;
  primary_function: string;
}

export const COMMERCIAL_TIERS: Record<CommercialTier, CommercialTierConfig> = {
  tier_1: {
    tier: 'tier_1',
    name: 'Farmers & Micro-Producers',
    persona: 'Producer',
    primary_function: 'Identity, wallet, plot data, evidence, simplified-path',
  },
  tier_2: {
    tier: 'tier_2',
    name: 'Exporters, Collectors & Cooperatives',
    persona: 'Aggregator',
    primary_function: 'Aggregation, lineage, shipment preparation',
  },
  tier_3: {
    tier: 'tier_3',
    name: 'EU Importers, Roasters & Brands',
    persona: 'Importer',
    primary_function: 'DDS preparation, downstream workflows, reporting',
  },
  tier_4: {
    tier: 'tier_4',
    name: 'Network Sponsors',
    persona: 'Sponsor',
    primary_function: 'Governance, delegated admin',
  },
};

// ============================================================
// LEGACY TENANT ROLE (for backwards compatibility during migration)
// Will be deprecated in favor of CommercialTier + LegalWorkflowRole
// ============================================================

export type TenantRole = 'exporter' | 'importer' | 'cooperative' | 'country_reviewer';

// Map legacy tenant roles to commercial tiers
export const TENANT_ROLE_TO_TIER: Record<TenantRole, CommercialTier> = {
  exporter: 'tier_2',
  importer: 'tier_3',
  cooperative: 'tier_2',
  country_reviewer: 'tier_3', // Reviewers are typically part of importer orgs
};

// ============================================================
// USER AND ORGANIZATION TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  // Legacy role system (backwards compatible)
  roles: TenantRole[];
  active_role: TenantRole;
  // New commercial tier system
  commercial_tier?: CommercialTier;
  // Organization-level legal role capability (what workflows they CAN perform)
  legal_role_capabilities?: LegalWorkflowRole[];
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  commercial_tier: CommercialTier;
  country: string;
  // Enterprise size for simplified-path eligibility
  enterprise_size?: 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
  // Legal role capabilities (which workflows this org can perform)
  legal_role_capabilities: LegalWorkflowRole[];
  created_at: string;
}

// Legacy Tenant type (backwards compatible)
export interface Tenant {
  id: string;
  name: string;
  type: TenantRole;
  country: string;
  created_at: string;
}

// ============================================================
// WORKFLOW TYPES (Section 6 of TRACEBUD_V1_2_EUDR_SPEC)
// ============================================================

export type WorkflowType =
  | 'OUT_OF_SCOPE_WORKFLOW'
  | 'DDS_WORKFLOW'
  | 'SIMPLIFIED_DECLARATION_WORKFLOW'
  | 'DOWNSTREAM_REFERENCE_WORKFLOW'
  | 'TRADER_RETENTION_WORKFLOW'
  | 'MANUAL_HOLD_WORKFLOW';

export interface RoleDecision {
  workflow_object_id: string;
  workflow_object_type: 'shipment' | 'dds_record' | 'simplified_declaration';
  organization_id: string;
  regulatory_profile_version: string;
  determined_role: LegalWorkflowRole;
  determined_workflow: WorkflowType;
  decision_path: string[]; // Audit trail of decision tree steps
  hold_reason?: string; // If PENDING_MANUAL_CLASSIFICATION
  decided_at: string;
  decided_by?: string; // If manually classified
}

// ============================================================
// SHIPMENT AND DDS TYPES
// ============================================================

export type ShipmentStatus =
  | 'DRAFT'
  | 'ASSEMBLY'
  | 'READY'
  | 'SEALED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type DDSStatus =
  | 'DRAFT'
  | 'VALIDATION_PENDING'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

// Legacy PackageStatus (backwards compatible)
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
  // New canonical status fields
  shipment_status?: ShipmentStatus;
  dds_status?: DDSStatus;
  // Legal role for this specific workflow
  legal_role?: LegalWorkflowRole;
  workflow_type?: WorkflowType;
  compliance_status: ComplianceStatus;
  plots: Plot[];
  farmers: Farmer[];
  tenant_id: string;
  created_by: string;
  traces_reference?: string;
  submitted_at?: string;
  regulatory_profile_version?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// COMPLIANCE ISSUE TYPES (Section 16 of TRACEBUD_V1_2_EUDR_SPEC)
// ============================================================

export type ComplianceIssueSeverity = 'BLOCKING' | 'WARNING' | 'INFO';

export type ComplianceIssueStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_EVIDENCE'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'WONT_FIX';

export type ComplianceIssueType =
  | 'DEFORESTATION_RISK'
  | 'MISSING_EVIDENCE'
  | 'FPIC_MISSING'
  | 'LABOR_COMPLIANCE'
  | 'YIELD_EXCEEDED'
  | 'ROLE_CLASSIFICATION_HOLD'
  | 'UPSTREAM_DDS_INVALID'
  | 'GEOMETRY_CONFLICT'
  | 'CONSENT_EXPIRED';

export interface ComplianceIssue {
  id: string;
  type: ComplianceIssueType;
  severity: ComplianceIssueSeverity;
  status: ComplianceIssueStatus;
  title: string;
  description: string;
  remediation_guidance: string;
  // Entity links
  shipment_id?: string;
  plot_id?: string;
  farmer_id?: string;
  yield_exception_id?: string;
  // Ownership
  owner_user_id?: string;
  owner_name?: string;
  // SLA tracking
  sla_due_at?: string;
  sla_breached: boolean;
  // Resolution
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  // Audit
  regulatory_profile_version: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// YIELD EXCEPTION TYPES (linked to compliance_issues)
// ============================================================

export type YieldExceptionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface YieldException {
  id: string;
  harvest_id: string;
  batch_id: string;
  plot_id: string;
  // Yield data
  actual_weight_kg: number;
  expected_max_weight_kg: number;
  ratio: number; // actual / expected
  yield_status: 'PASS' | 'WARNING' | 'BLOCKED';
  // Exception request
  exception_status: YieldExceptionStatus;
  justification?: string;
  requested_by?: string;
  requested_at?: string;
  // Linked compliance issue (MUST exist for WARNING/BLOCKED)
  compliance_issue_id?: string;
  // Approval
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REQUEST CAMPAIGNS (Section 51.1 MVP Scope)
// ============================================================

export type RequestCampaignStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface RequestCampaign {
  id: string;
  title: string;
  description: string;
  request_type: 'EVIDENCE' | 'FPIC' | 'CONSENT' | 'PLOT_UPDATE';
  status: RequestCampaignStatus;
  // Targets
  target_organization_ids: string[];
  target_farmer_ids: string[];
  target_plot_ids: string[];
  // Timeline
  due_at: string;
  reminder_sent_at?: string;
  // Responses
  accepted_count: number;
  pending_count: number;
  expired_count: number;
  // Owner
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// AUDIT EVENT TYPES (Section 17)
// ============================================================

export type AuditEventType =
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_SEALED'
  | 'DDS_SUBMITTED'
  | 'DDS_ACCEPTED'
  | 'DDS_REJECTED'
  | 'COMPLIANCE_ISSUE_CREATED'
  | 'COMPLIANCE_ISSUE_RESOLVED'
  | 'ROLE_DECISION_MADE'
  | 'ROLE_MANUALLY_CLASSIFIED'
  | 'YIELD_EXCEPTION_REQUESTED'
  | 'YIELD_EXCEPTION_APPROVED'
  | 'YIELD_EXCEPTION_REJECTED'
  | 'REQUEST_CAMPAIGN_SENT'
  | 'EVIDENCE_UPLOADED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'LIABILITY_ACKNOWLEDGED';

export interface AuditEvent {
  id: string;
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  payload: Record<string, unknown>;
  regulatory_profile_version: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================================
// LEGACY TYPES (backwards compatible)
// ============================================================

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
  geometry_version?: number;
  geometry_hash?: string;
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
  // Consent tracking
  data_use_consent?: boolean;
  data_use_consent_expires_at?: string;
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
  // Provenance chain
  sha256_hash?: string;
  upload_timestamp?: string;
  metadata_extracted?: Record<string, unknown>;
  // Review status
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  review_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  // New canonical metrics
  blocking_issues_count?: number;
  yield_failures_count?: number;
  pending_role_decisions?: number;
  open_request_campaigns?: number;
}
