import type { TimelineEvent, TimelineEventType } from '@/components/ui/timeline-row';

type ActivityPackage = {
  id: string;
  code?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
  compliance_status?: string;
};

type ActivityCampaign = {
  id: string;
  title?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
};

type ActivityOrganisation = {
  id?: string;
  name?: string;
  country?: string;
  onboardingCompleteness?: number;
  created_at?: string;
  updated_at?: string;
};

type AuditRow = {
  id: string | number;
  timestamp: string;
  event_type: string;
  payload?: Record<string, unknown>;
};

function mapAuditEventType(eventType: string): TimelineEventType {
  if (eventType.includes('approval')) return 'approval';
  if (eventType.includes('alert')) return 'alert';
  if (eventType.includes('upload')) return 'document_uploaded';
  if (eventType.includes('batch')) return 'submission';
  return 'status_change';
}

export function packagesToTimelineEvents(packages: ActivityPackage[]): TimelineEvent[] {
  return packages.map((pkg) => ({
    id: `pkg-${pkg.id}`,
    eventType: 'status_change',
    timestamp: pkg.updated_at ?? pkg.created_at ?? new Date().toISOString(),
    userName: 'Shipment workspace',
    description: `Shipment ${pkg.code ?? pkg.id} is ${pkg.status ?? 'updated'}`,
    metadata: {
      compliance: pkg.compliance_status ?? 'unknown',
    },
  }));
}

export function campaignsToTimelineEvents(campaigns: ActivityCampaign[]): TimelineEvent[] {
  return campaigns.map((campaign) => ({
    id: `cmp-${campaign.id}`,
    eventType: campaign.status === 'COMPLETED' ? 'approval' : 'submission',
    timestamp: campaign.updated_at ?? campaign.created_at ?? new Date().toISOString(),
    userName: 'Programmes',
    description: `${campaign.title ?? 'Campaign'} marked ${campaign.status ?? 'updated'}`,
  }));
}

export function organisationsToTimelineEvents(organisations: ActivityOrganisation[]): TimelineEvent[] {
  return organisations
    .filter((org) => Boolean(org.updated_at || org.created_at))
    .slice(0, 6)
    .map((org, index) => ({
      id: `org-${org.id ?? index}`,
      eventType: Number(org.onboardingCompleteness ?? 0) < 80 ? 'alert' : 'status_change',
      timestamp: org.updated_at ?? org.created_at ?? new Date(0).toISOString(),
      userName: 'Network health',
      description: `${org.name ?? 'Organisation'} (${org.country ?? 'Unknown'}) onboarding ${org.onboardingCompleteness ?? 0}% complete`,
    }));
}

export function auditRowsToTimelineEvents(rows: AuditRow[]): TimelineEvent[] {
  return rows.map((row) => {
    const payload = row.payload ?? {};
    const batch = (payload.batch ?? {}) as Record<string, unknown>;
    const description =
      typeof payload.description === 'string'
        ? payload.description
        : typeof batch.batch_id === 'string'
          ? `Batch ${batch.batch_id} recorded (${String(batch.status ?? 'recorded')})`
          : `Dashboard event ${row.event_type}`;

    return {
      id: `audit-${row.id}`,
      eventType: mapAuditEventType(row.event_type),
      timestamp: row.timestamp,
      userName: 'Dashboard',
      description,
    };
  });
}

export function mergeTimelineEvents(...groups: TimelineEvent[][]): TimelineEvent[] {
  const seen = new Set<string>();
  return groups
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
}
