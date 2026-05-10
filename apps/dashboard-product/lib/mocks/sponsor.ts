import type { TimelineEvent } from '@/components/ui/timeline-row';

export interface SponsoredOrg {
  id: string;
  name: string;
  type: string;
  farmers_count: number;
  plots_count: number;
  compliance_rate: number;
  pending_campaigns: number;
  status: 'active' | 'at_risk' | 'inactive';
}

export interface Campaign {
  id: string;
  title: string;
  type: string;
  target_orgs: number;
  responses: { sent: number; received: number; pending: number };
  deadline: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
}

export const mockSponsoredOrgs: SponsoredOrg[] = [
  {
    id: 'org-1',
    name: 'Cocoa Farmers Collective',
    type: 'cooperative',
    farmers_count: 245,
    plots_count: 312,
    compliance_rate: 94,
    pending_campaigns: 2,
    status: 'active',
  },
  {
    id: 'org-2',
    name: 'Highland Coffee Producers',
    type: 'cooperative',
    farmers_count: 128,
    plots_count: 156,
    compliance_rate: 87,
    pending_campaigns: 1,
    status: 'active',
  },
  {
    id: 'org-3',
    name: 'Sustainable Palm Network',
    type: 'association',
    farmers_count: 89,
    plots_count: 104,
    compliance_rate: 72,
    pending_campaigns: 3,
    status: 'at_risk',
  },
  {
    id: 'org-4',
    name: 'Amazon Forest Guardians',
    type: 'ngo',
    farmers_count: 67,
    plots_count: 83,
    compliance_rate: 98,
    pending_campaigns: 0,
    status: 'active',
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Q2 FPIC Documentation Update',
    type: 'FPIC',
    target_orgs: 3,
    responses: { sent: 245, received: 189, pending: 56 },
    deadline: '2026-04-30',
    status: 'RUNNING',
  },
  {
    id: 'camp-2',
    title: 'Plot Boundary Verification',
    type: 'PLOT_UPDATE',
    target_orgs: 2,
    responses: { sent: 156, received: 45, pending: 111 },
    deadline: '2026-05-15',
    status: 'RUNNING',
  },
  {
    id: 'camp-3',
    title: 'Deforestation Assessment 2026',
    type: 'EVIDENCE',
    target_orgs: 4,
    responses: { sent: 0, received: 0, pending: 0 },
    deadline: '2026-06-01',
    status: 'DRAFT',
  },
];

export const mockSponsorActivity: TimelineEvent[] = [
  {
    id: '1',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userName: 'Cocoa Farmers Collective',
    description: 'Submitted 23 FPIC consent documents',
  },
  {
    id: '2',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    userName: 'Highland Coffee Producers',
    description: 'Completed plot boundary verification for 45 plots',
  },
  {
    id: '3',
    eventType: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    userName: 'Sustainable Palm Network',
    description: 'Compliance rate dropped below 75% threshold',
  },
  {
    id: '4',
    eventType: 'user_created',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    userName: 'Amazon Forest Guardians',
    description: 'Onboarded 12 new farmers to the platform',
  },
];
