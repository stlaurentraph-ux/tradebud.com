/**
 * AUDIT EVENT PAYLOAD SCHEMAS
 *
 * Defines all audit event types, their payloads, and emission triggers.
 * Reference: TRACEBUD_V1_2_EUDR_SPEC Section 17 (Audit Events)
 *
 * Design Principles:
 * - Every compliance-relevant action must emit an audit event
 * - Payloads must contain all data needed to reconstruct the action
 * - Regulatory profile version must be stored with every event
 * - Events are immutable - no updates or deletes allowed
 */

import type {
  LegalWorkflowRole,
  WorkflowType,
  ComplianceIssueStatus,
  ComplianceIssueSeverity,
  ShipmentStatus,
} from '@/types';

// ============================================================
// AUDIT EVENT TYPES
// ============================================================

export type AuditEventType =
  // Shipment Events
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_UPDATED'
  | 'SHIPMENT_SEALED'
  | 'SHIPMENT_UNSEALED'
  | 'SHIPMENT_CANCELLED'
  | 'SHIPMENT_LINE_ADDED'
  | 'SHIPMENT_LINE_REMOVED'
  // DDS Events
  | 'DDS_CREATED'
  | 'DDS_VALIDATED'
  | 'DDS_SUBMITTED'
  | 'DDS_ACCEPTED'
  | 'DDS_REJECTED'
  | 'DDS_SUPERSEDED'
  | 'DDS_WITHDRAWN'
  // Compliance Events
  | 'COMPLIANCE_ISSUE_CREATED'
  | 'COMPLIANCE_ISSUE_ASSIGNED'
  | 'COMPLIANCE_ISSUE_STATUS_CHANGED'
  | 'COMPLIANCE_ISSUE_RESOLVED'
  | 'COMPLIANCE_ISSUE_ESCALATED'
  | 'SLA_BREACHED'
  // Role Decision Events
  | 'ROLE_DECISION_MADE'
  | 'ROLE_MANUALLY_CLASSIFIED'
  | 'ROLE_CLASSIFICATION_DISPUTED'
  // Yield Events
  | 'YIELD_CHECK_PERFORMED'
  | 'YIELD_EXCEPTION_REQUESTED'
  | 'YIELD_EXCEPTION_APPROVED'
  | 'YIELD_EXCEPTION_REJECTED'
  // Request Campaign Events
  | 'REQUEST_CAMPAIGN_CREATED'
  | 'REQUEST_CAMPAIGN_STARTED'
  | 'REQUEST_CAMPAIGN_COMPLETED'
  | 'REQUEST_CAMPAIGN_PARTIAL'
  | 'REQUEST_CAMPAIGN_REMINDER_SENT'
  | 'REQUEST_CAMPAIGN_RESPONSE_RECEIVED'
  | 'REQUEST_CAMPAIGN_EXPIRED'
  | 'REQUEST_CAMPAIGN_CANCELLED'
  // Evidence Events
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_VERIFIED'
  | 'EVIDENCE_REJECTED'
  | 'EVIDENCE_SUPERSEDED'
  // Consent Events
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'CONSENT_EXPIRED'
  // Legal Acknowledgement Events
  | 'LIABILITY_ACKNOWLEDGED'
  | 'REGULATORY_ATTESTATION_SIGNED'
  // User/Admin Events
  | 'USER_INVITED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DEACTIVATED'
  | 'ORG_SETTINGS_CHANGED'
  // Data Export Events
  | 'DATA_EXPORT_REQUESTED'
  | 'DATA_EXPORT_COMPLETED'
  | 'DATA_DELETION_REQUESTED'
  | 'DATA_DELETION_COMPLETED';

// ============================================================
// BASE AUDIT EVENT STRUCTURE
// ============================================================

export interface BaseAuditEvent {
  id: string;
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  regulatory_profile_version: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
}

// ============================================================
// SHIPMENT EVENT PAYLOADS
// ============================================================

export interface ShipmentCreatedPayload {
  shipment_code: string;
  season: string;
  year: number;
  supplier_name: string;
  initial_status: ShipmentStatus;
  legal_role?: LegalWorkflowRole;
  workflow_type?: WorkflowType;
}

export interface ShipmentSealedPayload {
  shipment_code: string;
  sealed_status: ShipmentStatus;
  legal_role: LegalWorkflowRole;
  workflow_type: WorkflowType;
  total_lines: number;
  total_weight_kg: number;
  compliance_check_passed: boolean;
  blocking_issues_count: number;
  warning_issues_count: number;
  pre_seal_checksum: string;
}

export interface ShipmentLineAddedPayload {
  shipment_code: string;
  line_id: string;
  plot_id: string;
  farmer_id: string;
  batch_id: string;
  weight_kg: number;
}

// ============================================================
// DDS EVENT PAYLOADS
// ============================================================

export interface DDSCreatedPayload {
  dds_id: string;
  shipment_id: string;
  shipment_code: string;
  legal_role: LegalWorkflowRole;
  workflow_type: WorkflowType;
}

export interface DDSSubmittedPayload {
  dds_id: string;
  shipment_code: string;
  submission_mode: 'MANUAL_ASSIST' | 'API_DIRECT';
  traces_reference?: string;
  submission_timestamp: string;
  total_coverage_hectares: number;
  total_weight_kg: number;
  country_of_origin: string[];
  product_codes: string[];
}

export interface DDSAcceptedPayload {
  dds_id: string;
  shipment_code: string;
  traces_reference: string;
  acceptance_timestamp: string;
  valid_until?: string;
}

export interface DDSRejectedPayload {
  dds_id: string;
  shipment_code: string;
  rejection_reason: string;
  rejection_code?: string;
  traces_reference?: string;
  rejection_timestamp: string;
}

export interface DDSSupersededPayload {
  dds_id: string;
  superseded_by_id: string;
  superseded_reason: string;
  original_traces_reference: string;
  new_traces_reference?: string;
}

// ============================================================
// COMPLIANCE EVENT PAYLOADS
// ============================================================

export interface ComplianceIssueCreatedPayload {
  issue_id: string;
  issue_type: string;
  severity: ComplianceIssueSeverity;
  title: string;
  description: string;
  shipment_id?: string;
  shipment_code?: string;
  plot_id?: string;
  farmer_id?: string;
  sla_due_at: string;
  auto_generated: boolean;
  trigger_source: string;
}

export interface ComplianceIssueStatusChangedPayload {
  issue_id: string;
  previous_status: ComplianceIssueStatus;
  new_status: ComplianceIssueStatus;
  reason?: string;
  assigned_to?: string;
}

export interface ComplianceIssueResolvedPayload {
  issue_id: string;
  resolution_type: 'FIXED' | 'DUPLICATE' | 'INVALID';
  resolution_notes: string;
  time_to_resolution_hours: number;
  sla_met: boolean;
}

export interface ComplianceIssueEscalatedPayload {
  issue_id: string;
  escalation_level: number;
  escalated_to_user_id: string;
  escalated_to_user_name: string;
  escalation_reason: string;
  previous_owner_id?: string;
}

export interface SLABreachedPayload {
  issue_id: string;
  sla_due_at: string;
  breached_at: string;
  hours_overdue: number;
  current_owner_id?: string;
  current_owner_name?: string;
  severity: ComplianceIssueSeverity;
}

// ============================================================
// ROLE DECISION EVENT PAYLOADS
// ============================================================

export interface RoleDecisionMadePayload {
  workflow_object_id: string;
  workflow_object_type: 'shipment' | 'dds_record' | 'simplified_declaration';
  determined_role: LegalWorkflowRole;
  determined_workflow: WorkflowType;
  decision_path: string[];
  auto_classified: boolean;
  confidence_score?: number;
}

export interface RoleManuallyClassifiedPayload {
  workflow_object_id: string;
  previous_role: LegalWorkflowRole;
  new_role: LegalWorkflowRole;
  justification: string;
  evidence_references?: string[];
  classifier_user_id: string;
  classifier_user_name: string;
}

// ============================================================
// YIELD EVENT PAYLOADS
// ============================================================

export interface YieldCheckPerformedPayload {
  harvest_id: string;
  batch_id: string;
  plot_id: string;
  actual_weight_kg: number;
  expected_max_weight_kg: number;
  ratio: number;
  result: 'PASS' | 'WARNING' | 'BLOCKED';
  threshold_source: string;
}

export interface YieldExceptionRequestedPayload {
  exception_id: string;
  harvest_id: string;
  batch_id: string;
  plot_id: string;
  actual_weight_kg: number;
  expected_max_weight_kg: number;
  ratio: number;
  justification: string;
  supporting_evidence_ids?: string[];
}

export interface YieldExceptionApprovedPayload {
  exception_id: string;
  harvest_id: string;
  approved_by_user_id: string;
  approved_by_user_name: string;
  approval_notes?: string;
  linked_compliance_issue_id?: string;
}

export interface YieldExceptionRejectedPayload {
  exception_id: string;
  harvest_id: string;
  rejected_by_user_id: string;
  rejected_by_user_name: string;
  rejection_reason: string;
  linked_compliance_issue_id?: string;
}

// ============================================================
// REQUEST CAMPAIGN EVENT PAYLOADS
// ============================================================

export interface RequestCampaignCreatedPayload {
  campaign_id: string;
  title: string;
  request_type:
    | 'MISSING_PRODUCER_PROFILE'
    | 'MISSING_PLOT_GEOMETRY'
    | 'MISSING_LAND_TITLE'
    | 'MISSING_HARVEST_RECORD'
    | 'YIELD_EVIDENCE'
    | 'CONSENT_GRANT'
    | 'DDS_REFERENCE'
    | 'GENERAL_EVIDENCE'
    | 'OTHER';
  target_count: number;
  due_at: string;
}

export interface RequestCampaignSentPayload {
  campaign_id: string;
  title: string;
  target_organization_ids: string[];
  target_farmer_ids: string[];
  target_plot_ids: string[];
  total_recipients: number;
}

export interface RequestCampaignResponseReceivedPayload {
  campaign_id: string;
  response_id: string;
  responder_id: string;
  responder_type: 'organization' | 'farmer';
  response_status: 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  evidence_ids?: string[];
}

// ============================================================
// EVIDENCE EVENT PAYLOADS
// ============================================================

export interface EvidenceUploadedPayload {
  evidence_id: string;
  evidence_type: string;
  plot_id: string;
  farmer_id?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  upload_source: 'web' | 'mobile' | 'api';
  metadata_extracted?: Record<string, unknown>;
}

export interface EvidenceVerifiedPayload {
  evidence_id: string;
  verification_status: 'approved' | 'rejected';
  verifier_user_id: string;
  verifier_user_name: string;
  verification_notes?: string;
  verification_method: 'manual' | 'automated';
}

// ============================================================
// CONSENT EVENT PAYLOADS
// ============================================================

export interface ConsentGrantedPayload {
  consent_id: string;
  farmer_id: string;
  consent_type: 'data_processing' | 'fpic' | 'marketing';
  granted_to_org_id: string;
  valid_until?: string;
  consent_text_version: string;
}

export interface ConsentRevokedPayload {
  consent_id: string;
  farmer_id: string;
  consent_type: string;
  revocation_reason?: string;
  data_deletion_required: boolean;
}

// ============================================================
// LIABILITY EVENT PAYLOADS
// ============================================================

export interface LiabilityAcknowledgedPayload {
  acknowledgement_id: string;
  shipment_id: string;
  shipment_code: string;
  legal_role: LegalWorkflowRole;
  acknowledgement_text_hash: string;
  acknowledgement_version: string;
  digital_signature?: string;
}

// ============================================================
// AUDIT EVENT EMISSION HELPER
// ============================================================

export interface EmitAuditEventParams<T = Record<string, unknown>> {
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string;
  payload: T;
}

/**
 * Emit an audit event to the backend
 * This is a client-side helper that calls the audit API
 */
export async function emitAuditEvent<T>({
  event_type,
  entity_type,
  entity_id,
  payload,
}: EmitAuditEventParams<T>): Promise<void> {
  // In production, this would call the audit API
  console.log('[v0] Audit event emitted:', {
    event_type,
    entity_type,
    entity_id,
    payload,
    timestamp: new Date().toISOString(),
  });

  // Example API call:
  // await fetch('/api/audit-events', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     event_type,
  //     entity_type,
  //     entity_id,
  //     payload,
  //   }),
  // });
}

// ============================================================
// EVENT TYPE METADATA
// ============================================================

export const AUDIT_EVENT_METADATA: Record<
  AuditEventType,
  {
    category: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    retention_years: number;
  }
> = {
  // Shipment Events
  SHIPMENT_CREATED: {
    category: 'Shipment',
    description: 'New shipment created',
    severity: 'info',
    retention_years: 5,
  },
  SHIPMENT_UPDATED: {
    category: 'Shipment',
    description: 'Shipment details updated',
    severity: 'info',
    retention_years: 5,
  },
  SHIPMENT_SEALED: {
    category: 'Shipment',
    description: 'Shipment sealed for submission',
    severity: 'critical',
    retention_years: 5,
  },
  SHIPMENT_UNSEALED: {
    category: 'Shipment',
    description: 'Shipment unsealed for editing',
    severity: 'warning',
    retention_years: 5,
  },
  SHIPMENT_CANCELLED: {
    category: 'Shipment',
    description: 'Shipment cancelled',
    severity: 'warning',
    retention_years: 5,
  },
  SHIPMENT_LINE_ADDED: {
    category: 'Shipment',
    description: 'Line item added to shipment',
    severity: 'info',
    retention_years: 5,
  },
  SHIPMENT_LINE_REMOVED: {
    category: 'Shipment',
    description: 'Line item removed from shipment',
    severity: 'info',
    retention_years: 5,
  },

  // DDS Events
  DDS_CREATED: {
    category: 'DDS',
    description: 'DDS record created',
    severity: 'info',
    retention_years: 5,
  },
  DDS_VALIDATED: {
    category: 'DDS',
    description: 'DDS passed validation',
    severity: 'info',
    retention_years: 5,
  },
  DDS_SUBMITTED: {
    category: 'DDS',
    description: 'DDS submitted to TRACES',
    severity: 'critical',
    retention_years: 5,
  },
  DDS_ACCEPTED: {
    category: 'DDS',
    description: 'DDS accepted by TRACES',
    severity: 'critical',
    retention_years: 5,
  },
  DDS_REJECTED: {
    category: 'DDS',
    description: 'DDS rejected by TRACES',
    severity: 'critical',
    retention_years: 5,
  },
  DDS_SUPERSEDED: {
    category: 'DDS',
    description: 'DDS superseded by new submission',
    severity: 'warning',
    retention_years: 5,
  },
  DDS_WITHDRAWN: {
    category: 'DDS',
    description: 'DDS withdrawn',
    severity: 'warning',
    retention_years: 5,
  },

  // Compliance Events
  COMPLIANCE_ISSUE_CREATED: {
    category: 'Compliance',
    description: 'Compliance issue created',
    severity: 'warning',
    retention_years: 5,
  },
  COMPLIANCE_ISSUE_ASSIGNED: {
    category: 'Compliance',
    description: 'Compliance issue assigned to user',
    severity: 'info',
    retention_years: 5,
  },
  COMPLIANCE_ISSUE_STATUS_CHANGED: {
    category: 'Compliance',
    description: 'Compliance issue status changed',
    severity: 'info',
    retention_years: 5,
  },
  COMPLIANCE_ISSUE_RESOLVED: {
    category: 'Compliance',
    description: 'Compliance issue resolved',
    severity: 'info',
    retention_years: 5,
  },
  COMPLIANCE_ISSUE_ESCALATED: {
    category: 'Compliance',
    description: 'Compliance issue escalated',
    severity: 'warning',
    retention_years: 5,
  },
  SLA_BREACHED: {
    category: 'Compliance',
    description: 'SLA deadline breached',
    severity: 'critical',
    retention_years: 5,
  },

  // Role Decision Events
  ROLE_DECISION_MADE: {
    category: 'Role Decision',
    description: 'Legal role determined',
    severity: 'info',
    retention_years: 5,
  },
  ROLE_MANUALLY_CLASSIFIED: {
    category: 'Role Decision',
    description: 'Legal role manually classified',
    severity: 'critical',
    retention_years: 5,
  },
  ROLE_CLASSIFICATION_DISPUTED: {
    category: 'Role Decision',
    description: 'Role classification disputed',
    severity: 'warning',
    retention_years: 5,
  },

  // Yield Events
  YIELD_CHECK_PERFORMED: {
    category: 'Yield',
    description: 'Yield check performed',
    severity: 'info',
    retention_years: 5,
  },
  YIELD_EXCEPTION_REQUESTED: {
    category: 'Yield',
    description: 'Yield exception requested',
    severity: 'warning',
    retention_years: 5,
  },
  YIELD_EXCEPTION_APPROVED: {
    category: 'Yield',
    description: 'Yield exception approved',
    severity: 'warning',
    retention_years: 5,
  },
  YIELD_EXCEPTION_REJECTED: {
    category: 'Yield',
    description: 'Yield exception rejected',
    severity: 'warning',
    retention_years: 5,
  },

  // Request Campaign Events
  REQUEST_CAMPAIGN_CREATED: {
    category: 'Request',
    description: 'Request campaign created',
    severity: 'info',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_STARTED: {
    category: 'Request',
    description: 'Request campaign started',
    severity: 'info',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_COMPLETED: {
    category: 'Request',
    description: 'Request campaign completed',
    severity: 'info',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_PARTIAL: {
    category: 'Request',
    description: 'Request campaign partially completed',
    severity: 'warning',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_REMINDER_SENT: {
    category: 'Request',
    description: 'Request campaign reminder sent',
    severity: 'info',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_RESPONSE_RECEIVED: {
    category: 'Request',
    description: 'Request campaign response received',
    severity: 'info',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_EXPIRED: {
    category: 'Request',
    description: 'Request campaign expired',
    severity: 'warning',
    retention_years: 5,
  },
  REQUEST_CAMPAIGN_CANCELLED: {
    category: 'Request',
    description: 'Request campaign cancelled',
    severity: 'info',
    retention_years: 5,
  },

  // Evidence Events
  EVIDENCE_UPLOADED: {
    category: 'Evidence',
    description: 'Evidence document uploaded',
    severity: 'info',
    retention_years: 5,
  },
  EVIDENCE_VERIFIED: {
    category: 'Evidence',
    description: 'Evidence document verified',
    severity: 'info',
    retention_years: 5,
  },
  EVIDENCE_REJECTED: {
    category: 'Evidence',
    description: 'Evidence document rejected',
    severity: 'warning',
    retention_years: 5,
  },
  EVIDENCE_SUPERSEDED: {
    category: 'Evidence',
    description: 'Evidence document superseded',
    severity: 'info',
    retention_years: 5,
  },

  // Consent Events
  CONSENT_GRANTED: {
    category: 'Consent',
    description: 'Data consent granted',
    severity: 'info',
    retention_years: 5,
  },
  CONSENT_REVOKED: {
    category: 'Consent',
    description: 'Data consent revoked',
    severity: 'critical',
    retention_years: 5,
  },
  CONSENT_EXPIRED: {
    category: 'Consent',
    description: 'Data consent expired',
    severity: 'warning',
    retention_years: 5,
  },

  // Liability Events
  LIABILITY_ACKNOWLEDGED: {
    category: 'Liability',
    description: 'Liability acknowledgement signed',
    severity: 'critical',
    retention_years: 5,
  },
  REGULATORY_ATTESTATION_SIGNED: {
    category: 'Liability',
    description: 'Regulatory attestation signed',
    severity: 'critical',
    retention_years: 5,
  },

  // User/Admin Events
  USER_INVITED: {
    category: 'User',
    description: 'User invited to organization',
    severity: 'info',
    retention_years: 5,
  },
  USER_ROLE_CHANGED: {
    category: 'User',
    description: 'User role changed',
    severity: 'warning',
    retention_years: 5,
  },
  USER_DEACTIVATED: {
    category: 'User',
    description: 'User deactivated',
    severity: 'warning',
    retention_years: 5,
  },
  ORG_SETTINGS_CHANGED: {
    category: 'Organization',
    description: 'Organization settings changed',
    severity: 'info',
    retention_years: 5,
  },

  // Data Export Events
  DATA_EXPORT_REQUESTED: {
    category: 'Data',
    description: 'Data export requested (GDPR SAR)',
    severity: 'info',
    retention_years: 5,
  },
  DATA_EXPORT_COMPLETED: {
    category: 'Data',
    description: 'Data export completed',
    severity: 'info',
    retention_years: 5,
  },
  DATA_DELETION_REQUESTED: {
    category: 'Data',
    description: 'Data deletion requested (GDPR)',
    severity: 'critical',
    retention_years: 5,
  },
  DATA_DELETION_COMPLETED: {
    category: 'Data',
    description: 'Data deletion completed',
    severity: 'critical',
    retention_years: 5,
  },
};
