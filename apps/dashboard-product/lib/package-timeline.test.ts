import { describe, expect, it } from 'vitest';
import { packageToTimelineEvents } from './package-timeline';
import type { DDSPackage } from '@/types';

const basePackage: DDSPackage = {
  id: 'pkg-1',
  code: 'PKG-001',
  supplier_name: 'Supplier',
  season: '2026',
  year: 2026,
  status: 'SUBMITTED',
  compliance_status: 'PASSED',
  plots: [],
  farmers: [],
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  traces_reference: 'TRACES-001',
  submitted_at: '2026-04-10T10:00:00.000Z',
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-10T10:00:00.000Z',
};

describe('packageToTimelineEvents', () => {
  it('includes creation, status, and submission events', () => {
    const events = packageToTimelineEvents(basePackage);
    expect(events.some((event) => event.description.includes('created'))).toBe(true);
    expect(events.some((event) => event.eventType === 'submission')).toBe(true);
    expect(events[0]?.timestamp).toBe('2026-04-10T10:00:00.000Z');
  });

  it('adds compliance alert for blocked packages', () => {
    const events = packageToTimelineEvents({
      ...basePackage,
      compliance_status: 'BLOCKED',
    });
    expect(events.some((event) => event.eventType === 'alert')).toBe(true);
  });
});
