import type { TimelineEvent } from '@/components/ui/timeline-row';
import type { DDSPackage } from '@/types';

export function packageToTimelineEvents(pkg: DDSPackage): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `${pkg.id}-created`,
      eventType: 'status_change',
      timestamp: pkg.created_at,
      userName: 'System',
      description: `Shipment ${pkg.code} created`,
      metadata: {
        status: pkg.status,
      },
    },
  ];

  if (pkg.updated_at && pkg.updated_at !== pkg.created_at) {
    events.push({
      id: `${pkg.id}-updated`,
      eventType: 'status_change',
      timestamp: pkg.updated_at,
      userName: 'System',
      description: `Shipment status is ${pkg.status}`,
      metadata: {
        compliance: pkg.compliance_status,
      },
    });
  }

  if (pkg.submitted_at) {
    events.push({
      id: `${pkg.id}-submitted`,
      eventType: 'submission',
      timestamp: pkg.submitted_at,
      userName: 'System',
      description: pkg.traces_reference
        ? `Submitted with reference ${pkg.traces_reference}`
        : 'Submitted to downstream handoff',
      metadata: pkg.traces_reference ? { reference: pkg.traces_reference } : undefined,
    });
  }

  if (pkg.compliance_status === 'BLOCKED' || pkg.compliance_status === 'WARNINGS') {
    events.push({
      id: `${pkg.id}-compliance`,
      eventType: 'alert',
      timestamp: pkg.updated_at,
      userName: 'Compliance engine',
      description:
        pkg.compliance_status === 'BLOCKED'
          ? 'Compliance checks reported blocking issues'
          : 'Compliance checks reported warnings',
      metadata: {
        compliance: pkg.compliance_status,
      },
    });
  }

  return events.sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}
