import { NextResponse } from 'next/server';

type ContactRecord = {
  consent_status?: 'unknown' | 'granted' | 'revoked';
};

type PlotRecord = {
  verified?: boolean;
  compliance_status?: string;
  deforestation_risk?: string;
};

type InboxRequest = {
  id: string;
  title?: string;
  due_at?: string;
  status?: string;
};

type Campaign = {
  id: string;
  request_type?: string;
  status?: string;
};

function isOverdue(dateInput?: string): boolean {
  if (!dateInput) return false;
  const timestamp = Date.parse(dateInput);
  if (Number.isNaN(timestamp)) return false;
  return timestamp < Date.now();
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const keyed = value as { data?: unknown; items?: unknown; campaigns?: unknown; requests?: unknown };
    if (Array.isArray(keyed.data)) return keyed.data as T[];
    if (Array.isArray(keyed.items)) return keyed.items as T[];
    if (Array.isArray(keyed.campaigns)) return keyed.campaigns as T[];
    if (Array.isArray(keyed.requests)) return keyed.requests as T[];
  }
  return [];
}

async function fetchBackendJson(path: string, authHeader: string | null): Promise<unknown> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    throw new Error('TRACEBUD_BACKEND_URL is required for cooperative insights.');
  }
  const response = await fetch(`${backendBase}${path}`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }
  return response.json().catch(() => []);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  try {
    const [contactsRaw, plotsRaw, inboxRaw, campaignsRaw] = await Promise.allSettled([
      fetchBackendJson('/v1/contacts', authHeader),
      fetchBackendJson('/v1/plots', authHeader),
      fetchBackendJson('/api/v1/inbox-requests', authHeader),
      fetchBackendJson('/v1/requests/campaigns', authHeader),
    ]);

    const contacts = contactsRaw.status === 'fulfilled' ? normalizeArray<ContactRecord>(contactsRaw.value) : [];
    const plots = plotsRaw.status === 'fulfilled' ? normalizeArray<PlotRecord>(plotsRaw.value) : [];
    const inbox = inboxRaw.status === 'fulfilled' ? normalizeArray<InboxRequest>(inboxRaw.value) : [];
    const campaigns = campaignsRaw.status === 'fulfilled' ? normalizeArray<Campaign>(campaignsRaw.value) : [];

    const compliantPlots = plots.filter((plot) => {
      if (plot.verified) return true;
      const complianceStatus = (plot.compliance_status ?? '').toUpperCase();
      if (complianceStatus === 'PASSED' || complianceStatus === 'COMPLIANT') return true;
      const risk = (plot.deforestation_risk ?? '').toLowerCase();
      return risk === 'low';
    }).length;

    const pendingInbox = inbox.filter((item) => (item.status ?? '').toUpperCase() === 'PENDING');
    const overdueInbox = pendingInbox.filter((item) => isOverdue(item.due_at));
    const activeCampaigns = campaigns.filter((item) => {
      const status = (item.status ?? '').toUpperCase();
      return status === 'DRAFT' || status === 'QUEUED' || status === 'RUNNING';
    });
    const blockedOrHighRiskPlots = plots.filter((plot) => {
      const complianceStatus = (plot.compliance_status ?? '').toUpperCase();
      const risk = (plot.deforestation_risk ?? '').toLowerCase();
      return complianceStatus === 'BLOCKED' || risk === 'high';
    }).length;

    const portabilityPending = campaigns.filter((item) =>
      (item.request_type ?? '').toUpperCase().includes('PORTABILITY'),
    ).length;

    const metrics = {
      total_farmers: contacts.length,
      members_missing_consent: contacts.filter((contact) => contact.consent_status !== 'granted').length,
      total_plots: plots.length,
      compliant_plots: compliantPlots,
      incoming_requests_pending: pendingInbox.length,
      requests_overdue: overdueInbox.length,
      active_campaigns: activeCampaigns.length,
      portability_reviews_pending: portabilityPending,
      blocking_issues_count: blockedOrHighRiskPlots + overdueInbox.length,
    };

    return NextResponse.json({
      metrics,
      integrations: {
        contacts: contactsRaw.status === 'fulfilled',
        plots: plotsRaw.status === 'fulfilled',
        inbox: inboxRaw.status === 'fulfilled',
        campaigns: campaignsRaw.status === 'fulfilled',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load cooperative insights.' },
      { status: 500 },
    );
  }
}
