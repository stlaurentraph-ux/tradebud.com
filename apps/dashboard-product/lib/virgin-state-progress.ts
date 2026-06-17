import type { ShipmentStatus, TenantRole } from '@/types';

export interface VirginProgressSignals {
  total_packages?: number;
  total_harvest_batches?: number;
  total_plots?: number;
  total_farmers?: number;
  packages_by_status?: Partial<Record<ShipmentStatus, number>>;
  organisation_count?: number;
  contact_count?: number;
  outgoing_requests_pending?: number;
  contacts_uploaded?: boolean;
  campaign_created?: boolean;
  first_plot_captured?: boolean;
}

const VIRGIN_STEPS_BY_ROLE: Record<TenantRole, number> = {
  exporter: 4,
  importer: 3,
  cooperative: 3,
  country_reviewer: 3,
  sponsor: 4,
};

export function getVirginStepCount(role: TenantRole): number {
  return VIRGIN_STEPS_BY_ROLE[role];
}

export function countCompletedVirginSteps(role: TenantRole, signals: VirginProgressSignals): number {
  const farmers = signals.total_farmers ?? 0;
  const plots = signals.total_plots ?? 0;
  const packages = signals.total_packages ?? 0;
  const readyOrSealed =
    (signals.packages_by_status?.READY ?? 0) + (signals.packages_by_status?.SEALED ?? 0);
  const orgs = signals.organisation_count ?? 0;
  const contacts = signals.contact_count ?? 0;
  const outgoing = signals.outgoing_requests_pending ?? 0;

  switch (role) {
    case 'exporter': {
      let completed = 0;
      const hasProducers = farmers > 0 || signals.contacts_uploaded;
      const hasPlots = plots > 0 || signals.first_plot_captured;
      const linkedLots = (signals.total_harvest_batches ?? 0) > 0;
      if (hasProducers) completed = 1;
      if (hasPlots) completed = Math.max(completed, 2);
      if (linkedLots || packages > 0) completed = Math.max(completed, 3);
      if (readyOrSealed > 0) completed = 4;
      return completed;
    }
    case 'importer': {
      let completed = 0;
      if (signals.contacts_uploaded || contacts > 0) completed = 1;
      if (signals.campaign_created || outgoing > 0) completed = Math.max(completed, 2);
      if (packages > 0) completed = Math.max(completed, 3);
      return completed;
    }
    case 'cooperative': {
      let completed = 0;
      if (farmers > 0 || signals.contacts_uploaded) completed = 1;
      if (plots > 0) completed = Math.max(completed, 2);
      if (signals.campaign_created || packages > 0) completed = Math.max(completed, 3);
      return completed;
    }
    case 'country_reviewer':
      return 0;
    case 'sponsor': {
      let completed = 0;
      if (contacts > 0) completed = 1;
      if (orgs > 0) completed = Math.max(completed, 2);
      if (signals.campaign_created || outgoing > 0) completed = Math.max(completed, 3);
      if (plots > 0 || packages > 0) completed = Math.max(completed, 4);
      return completed;
    }
    default:
      return 0;
  }
}

export function readVirginOnboardingFlags(): Pick<
  VirginProgressSignals,
  'contacts_uploaded' | 'campaign_created' | 'first_plot_captured'
> {
  if (typeof window === 'undefined') {
    return { contacts_uploaded: false, campaign_created: false, first_plot_captured: false };
  }
  return {
    contacts_uploaded: window.sessionStorage.getItem('tracebud_onboarding_action_contacts_uploaded') === '1',
    campaign_created: window.sessionStorage.getItem('tracebud_onboarding_action_campaign_created') === '1',
    first_plot_captured:
      window.sessionStorage.getItem('tracebud_onboarding_action_first_plot_captured') === '1',
  };
}
