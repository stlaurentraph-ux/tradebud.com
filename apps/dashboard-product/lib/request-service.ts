import type { RequestCampaign } from '@/types';

export type InboxRequestStatus = 'PENDING' | 'RESPONDED';

export interface InboxRequest {
  id: string;
  campaign_id: string;
  title: string;
  request_type: RequestCampaign['request_type'];
  due_at: string;
  from_org: string;
  sender_tenant_id: string;
  recipient_tenant_id: string;
  status: InboxRequestStatus;
  created_at: string;
  updated_at: string;
}

type RequestsListener = () => void;

const INITIAL_INBOX_REQUESTS: InboxRequest[] = [
  {
    id: 'req_inbox_001',
    campaign_id: 'campaign_demo_001',
    title: 'Upload updated FPIC packet',
    request_type: 'CONSENT_GRANT',
    due_at: '2026-04-15T23:59:59Z',
    from_org: 'Great Lakes Exporters',
    sender_tenant_id: 'tenant_brazil_001',
    recipient_tenant_id: 'tenant_rwanda_001',
    status: 'PENDING',
    created_at: '2026-04-08T09:00:00Z',
    updated_at: '2026-04-08T09:00:00Z',
  },
  {
    id: 'req_inbox_002',
    campaign_id: 'campaign_demo_002',
    title: 'Confirm missing plot geometry evidence',
    request_type: 'MISSING_PLOT_GEOMETRY',
    due_at: '2026-04-12T23:59:59Z',
    from_org: 'Great Lakes Exporters',
    sender_tenant_id: 'tenant_brazil_001',
    recipient_tenant_id: 'tenant_rwanda_001',
    status: 'PENDING',
    created_at: '2026-04-08T10:00:00Z',
    updated_at: '2026-04-08T10:00:00Z',
  },
  {
    id: 'req_inbox_003',
    campaign_id: 'campaign_demo_003',
    title: 'Attach generalized evidence document',
    request_type: 'GENERAL_EVIDENCE',
    due_at: '2026-04-18T23:59:59Z',
    from_org: 'Great Lakes Exporters',
    sender_tenant_id: 'tenant_brazil_001',
    recipient_tenant_id: 'tenant_rwanda_001',
    status: 'PENDING',
    created_at: '2026-04-08T11:00:00Z',
    updated_at: '2026-04-08T11:00:00Z',
  },
];

let inboxRequests: InboxRequest[] = INITIAL_INBOX_REQUESTS.map((item) => ({ ...item }));
const listeners = new Set<RequestsListener>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function emitRequestsUpdated(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeRequests(listener: RequestsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRequestsSnapshot(): InboxRequest[] {
  return inboxRequests.map((item) => ({ ...item }));
}

export function resetRequestData(): void {
  inboxRequests = INITIAL_INBOX_REQUESTS.map((item) => ({ ...item }));
  emitRequestsUpdated();
}

export function seedFirstCustomerRequests(): void {
  const now = new Date().toISOString();
  inboxRequests = [
    {
      id: 'req_inbox_seed_001',
      campaign_id: 'campaign_seed_001',
      title: 'Upload updated FPIC packet',
      request_type: 'CONSENT_GRANT',
      due_at: '2026-04-15T23:59:59Z',
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_brazil_001',
      recipient_tenant_id: 'tenant_rwanda_001',
      status: 'PENDING',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'req_inbox_seed_002',
      campaign_id: 'campaign_seed_002',
      title: 'Confirm missing plot geometry evidence',
      request_type: 'MISSING_PLOT_GEOMETRY',
      due_at: '2026-04-12T23:59:59Z',
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_brazil_001',
      recipient_tenant_id: 'tenant_rwanda_001',
      status: 'PENDING',
      created_at: now,
      updated_at: now,
    },
  ];
  emitRequestsUpdated();
}

export function seedGoldenPathRequests(): void {
  const now = new Date().toISOString();
  inboxRequests = [
    {
      id: 'req_inbox_gp_001',
      campaign_id: 'campaign_gp_001',
      title: 'Upload updated FPIC packet',
      request_type: 'CONSENT_GRANT',
      due_at: '2026-04-15T23:59:59Z',
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_brazil_001',
      recipient_tenant_id: 'tenant_rwanda_001',
      status: 'RESPONDED',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'req_inbox_gp_002',
      campaign_id: 'campaign_gp_002',
      title: 'Confirm missing plot geometry evidence',
      request_type: 'MISSING_PLOT_GEOMETRY',
      due_at: '2026-04-12T23:59:59Z',
      from_org: 'Great Lakes Exporters',
      sender_tenant_id: 'tenant_brazil_001',
      recipient_tenant_id: 'tenant_rwanda_001',
      status: 'PENDING',
      created_at: now,
      updated_at: now,
    },
  ];
  emitRequestsUpdated();
}

export async function listInboxRequests(tenantId: string): Promise<InboxRequest[]> {
  await wait(120);
  return inboxRequests
    .filter((item) => item.recipient_tenant_id === tenantId)
    .map((item) => ({ ...item }));
}

export async function respondToInboxRequest(id: string, tenantId: string): Promise<InboxRequest> {
  await wait(150);
  const index = inboxRequests.findIndex(
    (item) => item.id === id && item.recipient_tenant_id === tenantId
  );
  if (index < 0) {
    throw new Error('Request not found for current tenant.');
  }
  if (inboxRequests[index].status === 'RESPONDED') {
    return { ...inboxRequests[index] };
  }

  const updated: InboxRequest = {
    ...inboxRequests[index],
    status: 'RESPONDED',
    updated_at: new Date().toISOString(),
  };
  inboxRequests[index] = updated;
  emitRequestsUpdated();
  return { ...updated };
}
