import type { InboxRequest, RequestCampaign } from '@/lib/use-requests';

const now = new Date();
const dueInDays = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};
const daysAgo = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const mockRequestCampaigns: RequestCampaign[] = [
  {
    id: 'campaign_demo_001',
    title: 'Request - Cocoa',
    request_type: 'GENERAL_EVIDENCE',
    status: 'RUNNING',
    due_at: dueInDays(21),
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
    target_contact_emails: ['jean-baptiste@demo.tracebud.local', 'marie@demo.tracebud.local'],
    accepted_count: 2,
    pending_count: 3,
    expired_count: 0,
  },
  {
    id: 'campaign_demo_002',
    title: 'Request - Coffee',
    request_type: 'MISSING_PLOT_GEOMETRY',
    status: 'DRAFT',
    due_at: dueInDays(30),
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    target_contact_emails: ['pierre@demo.tracebud.local'],
    accepted_count: 0,
    pending_count: 0,
    expired_count: 0,
  },
  {
    id: 'campaign_demo_003',
    title: 'Campaign - Palm Oil',
    request_type: 'CONSENT_GRANT',
    status: 'COMPLETED',
    due_at: daysAgo(3),
    created_at: daysAgo(20),
    updated_at: daysAgo(4),
    target_contact_emails: ['esperance@demo.tracebud.local', 'emmanuel@demo.tracebud.local'],
    accepted_count: 2,
    pending_count: 0,
    expired_count: 0,
  },
];

export function getMockInboxRequests(tenantId: string): InboxRequest[] {
  return [
    {
      id: 'req_inbox_demo_001',
      campaign_id: 'campaign_demo_001',
      title: 'Upload updated FPIC packet',
      request_type: 'CONSENT_GRANT',
      due_at: dueInDays(14),
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_exporter_demo',
      recipient_tenant_id: tenantId,
      status: 'PENDING',
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
    {
      id: 'req_inbox_demo_002',
      campaign_id: 'campaign_demo_002',
      title: 'Confirm missing plot geometry evidence',
      request_type: 'MISSING_PLOT_GEOMETRY',
      due_at: dueInDays(10),
      from_org: 'Euro Import Partners',
      sender_tenant_id: 'tenant_importer_demo',
      recipient_tenant_id: tenantId,
      status: 'PENDING',
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: 'req_inbox_demo_003',
      campaign_id: 'campaign_demo_003',
      title: 'Attach generalized evidence document',
      request_type: 'GENERAL_EVIDENCE',
      due_at: dueInDays(18),
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_exporter_demo',
      recipient_tenant_id: tenantId,
      status: 'RESPONDED',
      created_at: daysAgo(8),
      updated_at: daysAgo(1),
    },
  ];
}

export const mockCooperativeInsights = {
  members_missing_consent: 3,
  requests_overdue: 2,
  portability_reviews_pending: 1,
  geometry_remediation_count: 4,
};
