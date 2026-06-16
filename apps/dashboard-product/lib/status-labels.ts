import { t as translate, type Locale } from '@/lib/i18n';
import { STATUS_LABELS, type StatusType } from '@/lib/constants/status';
import type { PackageComplianceStatus, ShipmentStatus, User } from '@/types';

type SupplyChainRole = User['active_role'] | null | undefined;
type TranslateFn = (key: string) => string;

const SHIPMENT_CHIP_STATUSES = new Set<StatusType>([
  'DRAFT',
  'READY',
  'SEALED',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'ARCHIVED',
  'ON_HOLD',
]);

function isShipmentChipStatus(status: StatusType): status is ShipmentStatus {
  return SHIPMENT_CHIP_STATUSES.has(status);
}

const SHIPMENT_STATUS_STYLES: Record<ShipmentStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  READY: 'bg-chart-2/20 text-chart-2',
  SEALED: 'bg-primary/20 text-primary',
  SUBMITTED: 'bg-chart-5/20 text-chart-5',
  ACCEPTED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-destructive/20 text-destructive',
  ARCHIVED: 'bg-muted text-muted-foreground',
  ON_HOLD: 'bg-chart-3/20 text-chart-3',
};

const COMPLIANCE_STATUS_STYLES: Record<PackageComplianceStatus, string> = {
  PASSED: 'bg-primary/20 text-primary',
  WARNINGS: 'bg-chart-3/20 text-chart-3',
  BLOCKED: 'bg-destructive/20 text-destructive',
  PENDING: 'bg-muted text-muted-foreground',
};

const EN_SHIPMENT_LABELS: Record<string, string> = {
  'status.shipment.draft': 'Draft',
  'status.shipment.ready': 'Ready',
  'status.shipment.sealed': 'Sealed',
  'status.shipment.submitted': 'Submitted',
  'status.shipment.handed_off': 'Handed off',
  'status.shipment.submitted_importer': 'Submitted to TRACES',
  'status.shipment.accepted': 'Accepted',
  'status.shipment.traces_accepted': 'TRACES accepted',
  'status.shipment.rejected': 'Rejected',
  'status.shipment.archived': 'Archived',
  'status.shipment.on_hold': 'On hold',
};

const EN_CHIP_LABELS: Record<string, string> = {
  'status.dds.ready_to_submit': 'Ready to submit',
  'status.dds.ready_to_submit_importer': 'Ready for TRACES filing',
  'status.dds.ready_to_submit_exporter': 'Ready for handoff',
  'status.dds.pending_confirmation': 'Pending TRACES confirmation',
  'status.dds.amendment_draft': 'Amendment draft',
  'status.dds.amended_submitted': 'Amended submitted',
  'status.dds.withdrawal_requested': 'Withdrawal requested',
  'status.dds.withdrawn': 'Withdrawn',
  'status.dds.superseded': 'Superseded',
  'status.issue.open': 'Open',
  'status.issue.resolved': 'Resolved',
  'status.issue.escalated': 'Escalated',
  'status.issue.in_progress': 'In progress',
  'status.chip.pending': 'Pending',
  'status.chip.approved': 'Approved',
  'status.chip.unavailable': 'Unavailable',
  'status.chip.success': 'Success',
  'status.chip.error': 'Error',
  'status.chip.warning': 'Warning',
  'status.chip.info': 'Info',
  'status.chip.loading': 'Pending...',
};

const EN_COMPLIANCE_LABELS: Record<string, string> = {
  'status.compliance.pending': 'Pending',
  'status.compliance.passed': 'Passed',
  'status.compliance.warnings': 'Warnings',
  'status.compliance.blocked': 'Blocked',
};

const EN_LIFECYCLE_LABELS: Record<string, string> = {
  'status.lifecycle.title.importer': 'Shipment filing lifecycle',
  'status.lifecycle.title.default': 'Shipment lifecycle',
  'status.lifecycle.current_prefix': 'Current status:',
  'status.lifecycle.blockers': ' · {{count}} blocker(s)',
  'status.lifecycle.step_current': 'Current',
  'status.lifecycle.full_timeline': 'Full timeline',
  'status.lifecycle.on_hold.importer': 'Shipment is on hold until declaration blockers are resolved.',
  'status.lifecycle.on_hold.default': 'Shipment is on hold until blocking issues are resolved.',
  'status.lifecycle.rejected.importer':
    'TRACES rejected this filing. Review blockers and remediate before resubmitting.',
  'status.lifecycle.rejected.default':
    'Downstream rejected this shipment. Review blockers and remediate before resubmitting.',
};

export function getShipmentStatusLabelKey(status: ShipmentStatus, role?: SupplyChainRole): string {
  if (status === 'SUBMITTED') {
    if (role === 'importer') return 'status.shipment.submitted_importer';
    if (role === 'exporter' || role === 'cooperative') return 'status.shipment.handed_off';
    return 'status.shipment.submitted';
  }
  if (status === 'ACCEPTED' && role === 'importer') {
    return 'status.shipment.traces_accepted';
  }

  const baseKeys: Record<ShipmentStatus, string> = {
    DRAFT: 'status.shipment.draft',
    READY: 'status.shipment.ready',
    SEALED: 'status.shipment.sealed',
    SUBMITTED: 'status.shipment.submitted',
    ACCEPTED: 'status.shipment.accepted',
    REJECTED: 'status.shipment.rejected',
    ARCHIVED: 'status.shipment.archived',
    ON_HOLD: 'status.shipment.on_hold',
  };
  return baseKeys[status];
}

export function getComplianceStatusLabelKey(status: PackageComplianceStatus): string {
  const keys: Record<PackageComplianceStatus, string> = {
    PENDING: 'status.compliance.pending',
    PASSED: 'status.compliance.passed',
    WARNINGS: 'status.compliance.warnings',
    BLOCKED: 'status.compliance.blocked',
  };
  return keys[status];
}

function resolveLabel(key: string, t?: TranslateFn, locale: Locale = 'en'): string {
  if (t) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  const fromLocale = translate(key, locale);
  if (fromLocale !== key) return fromLocale;
  return EN_SHIPMENT_LABELS[key] ?? EN_COMPLIANCE_LABELS[key] ?? EN_CHIP_LABELS[key] ?? EN_LIFECYCLE_LABELS[key] ?? key;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}

function resolveLifecycleLabel(
  key: string,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const resolved = resolveLabel(key, t);
  const text = resolved === key ? (EN_LIFECYCLE_LABELS[key] ?? key) : resolved;
  return values ? interpolate(text, values) : text;
}

export function getShipmentStatusLabel(
  status: ShipmentStatus,
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  return resolveLabel(getShipmentStatusLabelKey(status, role), t);
}

export function getComplianceStatusLabel(
  status: PackageComplianceStatus,
  t?: TranslateFn,
): string {
  return resolveLabel(getComplianceStatusLabelKey(status), t);
}

export function getShipmentStatusStyles(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_STYLES[status];
}

export function getComplianceStatusStyles(status: PackageComplianceStatus): string {
  return COMPLIANCE_STATUS_STYLES[status];
}

export function getShipmentLifecycleTitle(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'status.lifecycle.title.importer' : 'status.lifecycle.title.default';
  return resolveLifecycleLabel(key, t);
}

export function getShipmentLifecycleCurrentPrefix(t?: TranslateFn): string {
  return resolveLifecycleLabel('status.lifecycle.current_prefix', t);
}

export function formatShipmentLifecycleBlockers(count: number, t?: TranslateFn): string {
  return resolveLifecycleLabel('status.lifecycle.blockers', t, { count });
}

export function getShipmentLifecycleStepCurrentLabel(t?: TranslateFn): string {
  return resolveLifecycleLabel('status.lifecycle.step_current', t);
}

export function getShipmentLifecycleFullTimelineLabel(t?: TranslateFn): string {
  return resolveLifecycleLabel('status.lifecycle.full_timeline', t);
}

export function getShipmentOnHoldMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'status.lifecycle.on_hold.importer' : 'status.lifecycle.on_hold.default';
  return resolveLifecycleLabel(key, t);
}

export function getShipmentRejectedMessage(role?: SupplyChainRole, t?: TranslateFn): string {
  const key =
    role === 'importer' ? 'status.lifecycle.rejected.importer' : 'status.lifecycle.rejected.default';
  return resolveLifecycleLabel(key, t);
}

export function getStatusChipLabelKey(status: StatusType, role?: SupplyChainRole): string {
  if (isShipmentChipStatus(status)) {
    return getShipmentStatusLabelKey(status, role);
  }
  if (status === 'BLOCKED') {
    return getComplianceStatusLabelKey('BLOCKED');
  }
  if (status === 'READY_TO_SUBMIT') {
    if (role === 'importer') return 'status.dds.ready_to_submit_importer';
    if (role === 'exporter' || role === 'cooperative') return 'status.dds.ready_to_submit_exporter';
    return 'status.dds.ready_to_submit';
  }

  const chipKeys: Partial<Record<StatusType, string>> = {
    PENDING: 'status.chip.pending',
    READY_TO_SUBMIT: 'status.dds.ready_to_submit',
    PENDING_CONFIRMATION: 'status.dds.pending_confirmation',
    AMENDMENT_DRAFT: 'status.dds.amendment_draft',
    AMENDED_SUBMITTED: 'status.dds.amended_submitted',
    WITHDRAWAL_REQUESTED: 'status.dds.withdrawal_requested',
    WITHDRAWN: 'status.dds.withdrawn',
    SUPERSEDED: 'status.dds.superseded',
    OPEN: 'status.issue.open',
    RESOLVED: 'status.issue.resolved',
    ESCALATED: 'status.issue.escalated',
    IN_PROGRESS: 'status.issue.in_progress',
    APPROVED: 'status.chip.approved',
    UNAVAILABLE: 'status.chip.unavailable',
    SUCCESS: 'status.chip.success',
    ERROR: 'status.chip.error',
    WARNING: 'status.chip.warning',
    INFO: 'status.chip.info',
  };
  return chipKeys[status] ?? `status.chip.${status.toLowerCase()}`;
}

export function getStatusChipLabel(
  status: StatusType,
  role?: SupplyChainRole,
  t?: TranslateFn,
): string {
  if (isShipmentChipStatus(status)) {
    return getShipmentStatusLabel(status, role, t);
  }
  const key = getStatusChipLabelKey(status, role);
  const resolved = resolveLabel(key, t);
  if (resolved !== key) return resolved;
  return STATUS_LABELS[status] ?? status;
}

export function getStatusChipLoadingLabel(t?: TranslateFn): string {
  return resolveLabel('status.chip.loading', t);
}
