import type { ContactStatus } from '@/lib/contact-service';

/** Supplier onboarding funnel — mirrors `supplier-onboarding.md` CRM states. */
export const CONTACT_PIPELINE_STATUSES = ['new', 'invited', 'engaged', 'submitted'] as const;

export type ContactPipelineStatus = (typeof CONTACT_PIPELINE_STATUSES)[number];

export function isContactPipelineStatus(status: ContactStatus): status is ContactPipelineStatus {
  return (CONTACT_PIPELINE_STATUSES as readonly string[]).includes(status);
}

export function getContactPipelineStepIndex(status: ContactStatus): number {
  if (!isContactPipelineStatus(status)) {
    return -1;
  }
  return CONTACT_PIPELINE_STATUSES.indexOf(status);
}

export function isContactPipelineStepComplete(
  status: ContactStatus,
  step: ContactPipelineStatus,
): boolean {
  const current = getContactPipelineStepIndex(status);
  const target = CONTACT_PIPELINE_STATUSES.indexOf(step);
  if (current < 0 || target < 0) {
    return false;
  }
  return current > target;
}

export function isContactPipelineStepCurrent(
  status: ContactStatus,
  step: ContactPipelineStatus,
): boolean {
  return status === step;
}
