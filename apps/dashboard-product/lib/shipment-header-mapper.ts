import type { DDSPackage, ShipmentStatus } from '@/types';
import type { CanonicalShipmentHeader } from '@/lib/shipment-headers-client';

export type ShipmentListRow = {
  id: string;
  code: string;
  label: string;
  status: ShipmentStatus;
  org_name: string;
  created_at: string;
  modified_at: string;
  owner: string;
  plots_count: number;
  farmers_count: number;
  batch_count: number;
  declared_quantity_kg: number;
  covered_quantity_kg: number;
  days_in_status: number;
  has_blocking_issues: boolean;
  package_ids: string[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(isoDate: string): number {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / MS_PER_DAY));
}

function resolveLinkedPackages(header: CanonicalShipmentHeader, packages: DDSPackage[]): DDSPackage[] {
  const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));
  return header.package_ids
    .map((packageId) => packageMap.get(packageId))
    .filter((pkg): pkg is DDSPackage => Boolean(pkg));
}

export function enrichShipmentHeaderRow(
  header: CanonicalShipmentHeader,
  packages: DDSPackage[],
  ownerLabel = 'Your organisation',
): ShipmentListRow {
  const linkedPackages = resolveLinkedPackages(header, packages);
  const plotsCount = linkedPackages.reduce((sum, pkg) => sum + pkg.plots.length, 0);
  const farmersCount = linkedPackages.reduce((sum, pkg) => sum + pkg.farmers.length, 0);
  const primarySupplier = linkedPackages[0]?.supplier_name?.trim();
  const hasBlockingIssues = linkedPackages.some(
    (pkg) => pkg.compliance_status === 'BLOCKED' || pkg.status === 'ON_HOLD' || pkg.status === 'REJECTED',
  );
  const statusAnchor = header.sealed_at ?? header.updated_at ?? header.created_at;

  return {
    id: header.id,
    code: header.shipment_reference,
    label: header.label,
    status: header.status,
    org_name: primarySupplier || header.label || 'Organisation shipment',
    created_at: header.created_at,
    modified_at: header.updated_at,
    owner: ownerLabel,
    plots_count: plotsCount,
    farmers_count: farmersCount,
    batch_count: header.package_ids.length,
    declared_quantity_kg: header.declared_quantity_kg,
    covered_quantity_kg: header.covered_quantity_kg,
    days_in_status: daysSince(statusAnchor),
    has_blocking_issues: hasBlockingIssues,
    package_ids: header.package_ids,
  };
}

export function mapShipmentHeadersToListRows(
  headers: CanonicalShipmentHeader[],
  packages: DDSPackage[],
  ownerLabel = 'Your organisation',
): ShipmentListRow[] {
  return headers.map((header) => enrichShipmentHeaderRow(header, packages, ownerLabel));
}
