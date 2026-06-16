import { describe, expect, it } from 'vitest';
import type { DDSPackage } from '@/types';
import {
  buildMiniReviewQueue,
  buildReviewQueueAction,
  isPackageInReviewQueue,
} from './compliance-review-queue';

function makePackage(overrides: Partial<DDSPackage>): DDSPackage {
  return {
    id: 'pkg-1',
    code: 'SHP-001',
    supplier_name: 'Origin Coop',
    season: 'A',
    year: 2024,
    status: 'READY',
    compliance_status: 'PASSED',
    plots: [],
    farmers: [],
    tenant_id: 'tenant-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('compliance-review-queue', () => {
  it('includes importer review statuses only', () => {
    expect(isPackageInReviewQueue(makePackage({ status: 'READY' }), 'importer')).toBe(true);
    expect(isPackageInReviewQueue(makePackage({ status: 'ACCEPTED' }), 'importer')).toBe(false);
  });

  it('prioritizes blocked compliance and on-hold shipments', () => {
    const queue = buildMiniReviewQueue(
      [
        makePackage({ id: 'a', code: 'A', status: 'READY', compliance_status: 'PASSED', updated_at: '2024-01-01T00:00:00Z' }),
        makePackage({ id: 'b', code: 'B', status: 'ON_HOLD', compliance_status: 'BLOCKED', updated_at: '2024-01-03T00:00:00Z' }),
        makePackage({ id: 'c', code: 'C', status: 'SEALED', compliance_status: 'WARNINGS', updated_at: '2024-01-02T00:00:00Z' }),
      ],
      'importer',
      5,
    );
    expect(queue[0]?.code).toBe('B');
  });

  it('routes importer sealed shipments to TRACES filing prep', () => {
    const action = buildReviewQueueAction('importer', makePackage({ status: 'SEALED', id: 'pkg-sealed' }));
    expect(action.actionLabel).toContain('TRACES');
    expect(action.actionHref).toBe('/compliance?package=pkg-sealed');
  });

  it('routes reviewer actions to package detail', () => {
    const action = buildReviewQueueAction('country_reviewer', makePackage({ id: 'pkg-review' }));
    expect(action.actionHref).toBe('/packages/pkg-review');
  });

  it('limits queue length', () => {
    const queue = buildMiniReviewQueue(
      Array.from({ length: 8 }, (_, index) =>
        makePackage({ id: `pkg-${index}`, code: `SHP-${index}`, status: 'READY' }),
      ),
      'country_reviewer',
      5,
    );
    expect(queue).toHaveLength(5);
  });
});
