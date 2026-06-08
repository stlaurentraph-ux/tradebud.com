import type { DDSPackage, Farmer, PackageComplianceStatus, Plot, ShipmentStatus } from '@/types';

export type BackendPackageRow = {
  id: string;
  farmer_id?: string;
  label?: string | null;
  status?: string | null;
  created_at: string;
  traces_reference?: string | null;
  plot_count?: number;
  compliant_plot_count?: number;
  sender_tenant_id?: string;
  sender_org?: string;
};

function mapBackendStatus(status?: string | null): ShipmentStatus {
  const normalized = (status ?? 'draft').trim().toLowerCase();
  if (normalized === 'submitted') return 'SUBMITTED';
  if (normalized === 'package_generated' || normalized === 'submission_inflight') return 'READY';
  if (normalized === 'accepted') return 'ACCEPTED';
  if (normalized === 'rejected') return 'REJECTED';
  if (normalized === 'archived') return 'ARCHIVED';
  if (normalized === 'on_hold') return 'ON_HOLD';
  if (normalized === 'sealed') return 'SEALED';
  return 'DRAFT';
}

function mapComplianceStatus(
  plotCount: number,
  compliantPlotCount: number,
  shipmentStatus: ShipmentStatus,
): PackageComplianceStatus {
  if (plotCount === 0) return 'PENDING';
  if (compliantPlotCount >= plotCount) return shipmentStatus === 'SUBMITTED' ? 'PASSED' : 'PENDING';
  if (compliantPlotCount === 0) return 'BLOCKED';
  return 'WARNINGS';
}

function buildPlotStubs(
  packageId: string,
  farmerId: string,
  plotCount: number,
  compliantPlotCount: number,
  createdAt: string,
): Plot[] {
  return Array.from({ length: plotCount }, (_, index) => ({
    id: `${packageId}_plot_${index}`,
    name: `Plot ${index + 1}`,
    farmer_id: farmerId,
    area_hectares: 0,
    deforestation_risk: 'low' as const,
    evidence: [],
    verified: index < compliantPlotCount,
    created_at: createdAt,
    updated_at: createdAt,
  }));
}

function buildFarmerStub(farmerId: string, createdAt: string, plots: Plot[]): Farmer {
  return {
    id: farmerId,
    name: 'Producer',
    plots,
    verified: plots.length > 0 && plots.every((plot) => plot.verified),
    fpic_signed: false,
    labor_compliant: false,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export function mapBackendPackageToDdsPackage(row: BackendPackageRow, fallbackTenantId: string): DDSPackage {
  const createdAt = row.created_at;
  const status = mapBackendStatus(row.status);
  const plotCount = row.plot_count ?? 0;
  const compliantPlotCount = row.compliant_plot_count ?? 0;
  const farmerId = row.farmer_id ?? `${row.id}_farmer`;
  const plots = buildPlotStubs(row.id, farmerId, plotCount, compliantPlotCount, createdAt);
  const farmers = row.farmer_id ? [buildFarmerStub(farmerId, createdAt, plots)] : [];
  const code = row.label?.trim() || `PKG-${row.id.slice(0, 8).toUpperCase()}`;

  return {
    id: row.id,
    code,
    supplier_name: row.sender_org?.trim() || 'Upstream supplier',
    season: 'Current',
    year: new Date(createdAt).getFullYear(),
    status,
    compliance_status: mapComplianceStatus(plotCount, compliantPlotCount, status),
    plots,
    farmers,
    tenant_id: row.sender_tenant_id ?? fallbackTenantId,
    created_by: 'system',
    traces_reference: row.traces_reference ?? undefined,
    submitted_at: status === 'SUBMITTED' ? createdAt : undefined,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export type BackendPackageDetailVoucher = {
  id: string;
  status?: string | null;
  created_at?: string;
  harvest_date?: string | null;
  kg?: number | null;
  plot_id?: string;
  plot_name?: string | null;
  plot_kind?: string | null;
  area_ha?: number | null;
  declared_area_ha?: number | null;
};

export type BackendPackageDetail = {
  package: BackendPackageRow;
  vouchers: BackendPackageDetailVoucher[];
};

function isVoucherPlotCompliant(status?: string | null): boolean {
  const normalized = (status ?? '').trim().toLowerCase();
  return normalized === 'verified' || normalized === 'compliant';
}

export function mapBackendPackageDetailToDdsPackage(
  detail: BackendPackageDetail,
  fallbackTenantId: string,
): DDSPackage {
  const row = detail.package;
  const vouchers = detail.vouchers ?? [];
  const farmerId = row.farmer_id ?? `${row.id}_farmer`;
  const plotMap = new Map<string, Plot>();

  for (const voucher of vouchers) {
    if (!voucher.plot_id || plotMap.has(voucher.plot_id)) {
      continue;
    }
    const plotTimestamp = voucher.created_at ?? row.created_at;
    plotMap.set(voucher.plot_id, {
      id: voucher.plot_id,
      name: voucher.plot_name?.trim() || `Plot ${plotMap.size + 1}`,
      farmer_id: farmerId,
      area_hectares: Number(voucher.declared_area_ha ?? voucher.area_ha ?? 0),
      deforestation_risk: 'low',
      evidence: [],
      verified: isVoucherPlotCompliant(voucher.status),
      created_at: plotTimestamp,
      updated_at: plotTimestamp,
    });
  }

  const plots = Array.from(plotMap.values());
  const compliantPlotCount = plots.filter((plot) => plot.verified).length;

  const base = mapBackendPackageToDdsPackage(
    {
      ...row,
      plot_count: plots.length,
      compliant_plot_count: compliantPlotCount,
    },
    fallbackTenantId,
  );

  return {
    ...base,
    plots,
    farmers: row.farmer_id ? [buildFarmerStub(farmerId, row.created_at, plots)] : [],
  };
}

export function mapBackendPackagesResponse(
  payload: unknown,
  fallbackTenantId: string,
): DDSPackage[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { packages?: unknown }).packages)
      ? ((payload as { packages: BackendPackageRow[] }).packages ?? [])
      : [];

  return rows.map((row) => mapBackendPackageToDdsPackage(row, fallbackTenantId));
}
