import type { DDSPackage, ShipmentStatus } from '@/types';

export type SlaHealth = 'healthy' | 'warning' | 'overdue';

export interface ShipmentSlaSnapshot {
  count: number;
  daysSLA: number;
  daysActive: number;
  health: SlaHealth;
}

const SLA_DAYS: Partial<Record<ShipmentStatus, number>> = {
  DRAFT: 7,
  READY: 5,
  SEALED: 10,
};

function daysSince(isoTimestamp: string): number {
  const timestamp = Date.parse(isoTimestamp);
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
}

function statusAgeAnchor(pkg: DDSPackage): string {
  if (pkg.status === 'DRAFT') {
    return pkg.created_at;
  }
  if (pkg.status === 'SUBMITTED' && pkg.submitted_at) {
    return pkg.submitted_at;
  }
  return pkg.updated_at ?? pkg.created_at;
}

export function daysInCurrentStatus(pkg: DDSPackage): number {
  return daysSince(statusAgeAnchor(pkg));
}

export function calculateSlaHealth(daysActive: number, daysSLA: number): SlaHealth {
  if (daysActive >= daysSLA) return 'overdue';
  if (daysActive >= daysSLA * 0.8) return 'warning';
  return 'healthy';
}

export function buildShipmentSlaSnapshots(
  packages: DDSPackage[],
  packagesByStatus: Partial<Record<ShipmentStatus, number>>,
): Record<'DRAFT' | 'READY' | 'SEALED', ShipmentSlaSnapshot> {
  const statuses = ['DRAFT', 'READY', 'SEALED'] as const;

  return statuses.reduce(
    (acc, status) => {
      const statusPackages = packages.filter((pkg) => pkg.status === status);
      const daysSLA = SLA_DAYS[status] ?? 7;
      const daysActive =
        statusPackages.length > 0
          ? Math.max(...statusPackages.map((pkg) => daysInCurrentStatus(pkg)))
          : 0;

      acc[status] = {
        count: packagesByStatus[status] ?? statusPackages.length,
        daysSLA,
        daysActive,
        health: calculateSlaHealth(daysActive, daysSLA),
      };
      return acc;
    },
    {} as Record<'DRAFT' | 'READY' | 'SEALED', ShipmentSlaSnapshot>,
  );
}
