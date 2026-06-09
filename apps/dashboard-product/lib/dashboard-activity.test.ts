// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  auditRowsToTimelineEvents,
  mergeTimelineEvents,
  organisationsToTimelineEvents,
} from './dashboard-activity';

describe('dashboard-activity', () => {
  it('maps audit rows with batch payloads to timeline events', () => {
    const events = auditRowsToTimelineEvents([
      {
        id: 1,
        timestamp: '2026-04-20T10:00:00.000Z',
        event_type: 'dashboard_batch_intake_recorded',
        payload: {
          batch: { batch_id: 'BATCH-001', status: 'warning' },
        },
      },
    ]);

    expect(events[0]?.description).toContain('BATCH-001');
    expect(events[0]?.eventType).toBe('submission');
  });

  it('skips organisations without timestamps in timeline feed', () => {
    const events = organisationsToTimelineEvents([
      { id: 'org-1', name: 'No timestamps', onboardingCompleteness: 40 },
      {
        id: 'org-2',
        name: 'With update',
        onboardingCompleteness: 90,
        updated_at: '2026-04-21T12:00:00.000Z',
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe('org-org-2');
  });

  it('deduplicates merged timeline events by id', () => {
    const merged = mergeTimelineEvents(
      [{ id: 'a', eventType: 'status_change', timestamp: '2026-04-21T10:00:00.000Z', userName: 'A', description: 'one' }],
      [{ id: 'a', eventType: 'status_change', timestamp: '2026-04-20T10:00:00.000Z', userName: 'A', description: 'dup' }],
      [{ id: 'b', eventType: 'alert', timestamp: '2026-04-19T10:00:00.000Z', userName: 'B', description: 'two' }],
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]?.id).toBe('a');
  });
});
