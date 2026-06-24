/**
 * Canonical audit event types for audit_log (and related tables).
 * Field cloud events must match apps/offline-product/features/sync/farmerArtifactRegistry.ts
 */
import { DDS_FILING_AUDIT_EVENT_TYPES } from '../harvest/backendFilingStateRegistry';

export const FIELD_CLOUD_AUDIT_EVENT_TYPES = [
  'producer_attestations_updated',
  'plot_compliance_declared',
  'plot_photos_synced',
  'plot_legal_synced',
  'field_device_preferences_updated',
  'farmer_profile_photo_synced',
  'plot_mapping_draft_saved',
  'plot_mapping_draft_cleared',
] as const;

export const BACKEND_DASHBOARD_AUDIT_EVENT_TYPES = [
  'dashboard_gated_entry_exported',
  'dashboard_gated_entry_attempt',
] as const;

export const BACKEND_ASSIGNMENT_AUDIT_EVENT_TYPES = [
  'plot_assignment_export_requested',
  'plot_assignment_export_succeeded',
  'plot_assignment_export_failed',
] as const;

export const BACKEND_CHAT_AUDIT_EVENT_TYPES = [
  'chat_thread_created',
  'chat_thread_message_posted',
  'chat_thread_message_replayed',
  'chat_thread_resolved',
  'chat_thread_reopened',
  'chat_thread_archived',
] as const;

export const BACKEND_WORKFLOW_AUDIT_EVENT_TYPES = [
  'workflow_template_created',
  'workflow_stage_transitioned',
  'workflow_stage_sla_warning',
  'workflow_stage_sla_breached',
  'workflow_stage_sla_escalated',
  'workflow_stage_sla_recovered',
] as const;

export const BACKEND_PLOT_AUDIT_EVENT_TYPES = [
  'plot_created',
  'plot_geometry_superseded',
  'plot_geometry_quality_checked',
  'plot_evidence_synced',
  'plot_deforestation_decision_recorded',
  'plot_compliance_checked',
  'plot_edited',
  'plot_review_cleared',
  'plot_review_upheld',
  'gfw_check_run',
  'gfw_check_failed',
  'farmer_set',
] as const;

export const BACKEND_HARVEST_AUDIT_EVENT_TYPES = ['harvest_recorded'] as const;

export const BACKEND_TENURE_AUDIT_EVENT_TYPES = [
  'tenure_parse_completed',
  'tenure_parse_reviewed',
  'tenure_review_alert_sent',
  'tenure_compliance_issue_resolved',
] as const;

export const BACKEND_INTEGRATION_AUDIT_EVENT_TYPES = [
  'integration_webhook_registered',
  'integration_delivery_attempt_queued',
  'integration_delivery_succeeded',
  'integration_delivery_retryable_failed',
  'integration_delivery_terminal_failed',
  'integration_eudr_echo_checked',
  'integration_eudr_dds_submitted',
  'integration_eudr_dds_status_checked',
  'integration_assessment_request_sent',
  'integration_assessment_request_status_updated',
] as const;

export const BACKEND_PARTNER_AUDIT_EVENT_TYPES = [
  'partner_dataset_requested',
  'partner_dataset_exported',
  'partner_sync_replayed',
  'partner_webhook_terminal_failed',
  'partner_webhook_retryable_failed',
  'partner_retry_sweep_started',
  'partner_retry_sweep_executed',
  'partner_retry_sweep_completed',
  'partner_retry_sweep_failed',
] as const;

export const BACKEND_CONSENT_AUDIT_EVENT_TYPES = [
  'consent_grant_requested',
  'consent_grant_approved',
  'consent_grant_denied',
  'consent_grant_revoked',
  'gdpr_erasure_requested',
] as const;

export const BACKEND_CONTACT_AUDIT_EVENT_TYPES = [
  'contact_created_or_updated',
  'contact_updated',
  'contact_deleted',
  'contact_status_changed',
] as const;

export const BACKEND_LAUNCH_AUDIT_EVENT_TYPES = [
  'trial_started',
  'trial_expired',
  'upgrade_completed',
  'feature_entitlement_updated',
  'onboarding_step_completed',
  'signup_completed',
  'signup_workspace_setup_completed',
  'onboarding_skipped',
  'commercial_profile_saved',
  'supply_chain_roles_updated',
] as const;

export const BACKEND_ONBOARDING_EMAIL_AUDIT_EVENT_TYPES = [
  'onboarding_welcome_email_sent',
  'farmer_welcome_email_sent',
  'onboarding_resume_nudge_sent',
] as const;

export const BACKEND_INBOX_AUDIT_EVENT_TYPES = [
  'inbox_requests_seeded',
  'inbox_request_responded',
  'inbox_request_evidence_attached',
  'inbox_request_campaign_reconciled',
  'inbox_requests_campaign_fanout',
  'inbox_requests_campaign_fanout_failed',
  'inbox_requests_signup_backfill',
  'inbox_requests_email_cta_inbox_ensured',
] as const;

export const BACKEND_YIELD_BENCHMARK_AUDIT_EVENT_TYPES = [
  'yield_benchmark_created',
  'yield_benchmark_import_started',
  'yield_benchmark_import_completed',
  'yield_benchmark_sync_completed',
  'yield_benchmark_updated',
  'yield_benchmark_activated',
] as const;

export const BACKEND_BILLING_AUDIT_EVENT_TYPES = ['billing_band_upgrade_accepted'] as const;

export const BACKEND_BULK_IMPORT_AUDIT_EVENT_TYPES = [
  'bulk_import_signing_key_registered',
  'bulk_import_signing_key_revoked',
  'bulk_import_policy_updated',
  'bulk_import_package_signature_verified',
  'bulk_import_package_signature_failed',
] as const;

/** @deprecated Use categorized arrays; kept for guard imports. */
export const BACKEND_PLATFORM_AUDIT_EVENT_TYPES = [
  ...BACKEND_DASHBOARD_AUDIT_EVENT_TYPES,
  ...BACKEND_ASSIGNMENT_AUDIT_EVENT_TYPES,
  ...BACKEND_CHAT_AUDIT_EVENT_TYPES,
  ...BACKEND_WORKFLOW_AUDIT_EVENT_TYPES,
  ...BACKEND_PLOT_AUDIT_EVENT_TYPES,
  ...BACKEND_HARVEST_AUDIT_EVENT_TYPES,
  ...BACKEND_TENURE_AUDIT_EVENT_TYPES,
  ...BACKEND_INTEGRATION_AUDIT_EVENT_TYPES,
  ...BACKEND_PARTNER_AUDIT_EVENT_TYPES,
  ...BACKEND_CONSENT_AUDIT_EVENT_TYPES,
  ...BACKEND_CONTACT_AUDIT_EVENT_TYPES,
  ...BACKEND_LAUNCH_AUDIT_EVENT_TYPES,
  ...BACKEND_ONBOARDING_EMAIL_AUDIT_EVENT_TYPES,
  ...BACKEND_INBOX_AUDIT_EVENT_TYPES,
  ...BACKEND_YIELD_BENCHMARK_AUDIT_EVENT_TYPES,
  ...BACKEND_BILLING_AUDIT_EVENT_TYPES,
  ...BACKEND_BULK_IMPORT_AUDIT_EVENT_TYPES,
  ...DDS_FILING_AUDIT_EVENT_TYPES,
] as const;

export const BACKEND_AUDIT_EVENT_TYPES = [
  ...FIELD_CLOUD_AUDIT_EVENT_TYPES,
  ...BACKEND_PLATFORM_AUDIT_EVENT_TYPES,
] as const;

export type BackendAuditEventType = (typeof BACKEND_AUDIT_EVENT_TYPES)[number];

/** Known dynamic audit prefixes — scanner expands phases from filing registry. */
export const BACKEND_AUDIT_DYNAMIC_PREFIXES = [
  'dds_package_readiness_',
  'dds_package_risk_score_',
  'dds_package_filing_preflight_',
  'dds_package_generation_',
  'dds_package_submission_',
] as const;

export {
  DDS_FILING_PREFLIGHT_PHASES,
  DDS_READINESS_STATES,
  DDS_SUBMISSION_STATES,
} from '../harvest/backendFilingStateRegistry';
