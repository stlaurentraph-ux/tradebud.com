import type { User } from '@/types';

type SupplyChainRole = User['active_role'] | null | undefined;

/** Voucher bundles (dds_package) — upstream identity-preserved lots. */
export function getBatchNavLabel(_role?: SupplyChainRole): string {
  return 'Batches';
}

export function getBatchPageTitle(_role?: SupplyChainRole): string {
  return 'Batches';
}

export function getBatchPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'cooperative') {
    return 'Bundle member harvest vouchers into lineage-safe batches before export handoff';
  }
  if (role === 'exporter') {
    return 'Bundle producer harvest vouchers into identity-preserved batches';
  }
  return 'Manage voucher-backed batch packages from verified plots';
}

export function getNewBatchLabel(_role?: SupplyChainRole): string {
  return 'New Batch';
}

/** EU-bound shipment assemblies combining one or more batches. */
export function getShipmentNavLabel(_role?: SupplyChainRole): string {
  return 'Shipments';
}

export function getShipmentPageSubtitle(role?: SupplyChainRole): string {
  if (role === 'importer') {
    return 'Review upstream shipments and assemble EU filing packages before TRACES submission';
  }
  return 'Combine batches into shipment headers, validate coverage, seal, and prepare EU filing';
}

export function getNewShipmentLabel(_role?: SupplyChainRole): string {
  return 'New Shipment';
}

export const SUPPLY_CHAIN_FLOW_HINT =
  'Harvest vouchers → Batch (package) → Shipment (EU filing unit). Batches preserve plot lineage; shipments combine batches just before TRACES.';
