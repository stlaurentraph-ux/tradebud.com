import type { DDSPackage, ShipmentStatus } from '@/types';
import { getPreflightResult, mockPackages } from '@/lib/mock-data';

type TransitionResult = {
  ok: true;
  pkg: DDSPackage;
};
type PackagesListener = () => void;

const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  DRAFT: ['READY', 'ON_HOLD'],
  READY: ['DRAFT', 'SEALED', 'ON_HOLD'],
  SEALED: ['SUBMITTED', 'ON_HOLD'],
  SUBMITTED: ['ACCEPTED', 'REJECTED', 'ON_HOLD'],
  ACCEPTED: ['ARCHIVED'],
  REJECTED: ['DRAFT', 'ON_HOLD'],
  ARCHIVED: [],
  ON_HOLD: ['DRAFT', 'READY'],
};

const INITIAL_PACKAGES: DDSPackage[] = mockPackages.map((pkg) => ({ ...pkg }));

// Local-only in-memory store to simulate API behavior.
let localPackages: DDSPackage[] = INITIAL_PACKAGES.map((pkg) => ({ ...pkg }));
const listeners = new Set<PackagesListener>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function emitPackagesUpdated(): void {
  listeners.forEach((listener) => listener());
}

export function subscribePackages(listener: PackagesListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPackagesSnapshot(): DDSPackage[] {
  return localPackages.map((pkg) => ({ ...pkg }));
}

export function resetPackageData(): void {
  localPackages = INITIAL_PACKAGES.map((pkg) => ({ ...pkg }));
  emitPackagesUpdated();
}

export function seedFirstCustomerPackages(): void {
  const now = new Date().toISOString();
  localPackages = INITIAL_PACKAGES.map((pkg) => ({ ...pkg }));
  localPackages = localPackages.map((pkg) => {
    if (pkg.id === 'pkg_001') return { ...pkg, status: 'SEALED', compliance_status: 'PASSED', updated_at: now };
    if (pkg.id === 'pkg_002') return { ...pkg, status: 'READY', compliance_status: 'WARNINGS', updated_at: now };
    if (pkg.id === 'pkg_003') return { ...pkg, status: 'SUBMITTED', compliance_status: 'PASSED', updated_at: now };
    if (pkg.id === 'pkg_004') return { ...pkg, status: 'DRAFT', compliance_status: 'PENDING', updated_at: now };
    if (pkg.id === 'pkg_005') return { ...pkg, status: 'ON_HOLD', compliance_status: 'BLOCKED', updated_at: now };
    return pkg;
  });
  emitPackagesUpdated();
}

function assertTransitionAllowed(
  pkg: DDSPackage,
  toStatus: ShipmentStatus,
  options?: { confirmLiability?: boolean }
): void {
  const allowed = TRANSITIONS[pkg.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid transition: ${pkg.status} -> ${toStatus}`);
  }

  if (toStatus === 'SEALED') {
    const preflight = getPreflightResult(pkg.id);
    if (preflight && preflight.blocking_issues.length > 0) {
      throw new Error('Cannot seal shipment with blocking compliance issues.');
    }
    if (pkg.compliance_status === 'BLOCKED') {
      throw new Error('Cannot seal shipment while compliance status is BLOCKED.');
    }
    if (!options?.confirmLiability) {
      throw new Error('Liability acknowledgement is required before sealing.');
    }
  }
}

export async function listPackages(): Promise<DDSPackage[]> {
  await wait(200);
  return getPackagesSnapshot();
}

export async function getPackage(id: string): Promise<DDSPackage | null> {
  await wait(150);
  const pkg = localPackages.find((item) => item.id === id);
  return pkg ? { ...pkg } : null;
}

export async function transitionPackage(
  id: string,
  toStatus: ShipmentStatus,
  options?: { confirmLiability?: boolean }
): Promise<TransitionResult> {
  await wait(250);
  const index = localPackages.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error('Package not found.');
  }

  const current = localPackages[index];
  assertTransitionAllowed(current, toStatus, options);

  const now = new Date().toISOString();
  const next: DDSPackage = {
    ...current,
    status: toStatus,
    updated_at: now,
    submitted_at: toStatus === 'SUBMITTED' ? now : current.submitted_at,
  };

  localPackages[index] = next;
  emitPackagesUpdated();
  return { ok: true, pkg: { ...next } };
}

