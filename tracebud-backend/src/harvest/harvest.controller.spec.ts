import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { HarvestController } from './harvest.controller';
import type { HarvestService } from './harvest.service';
import { createLaunchServiceMock } from '../testing/launch-service.mock';
import type { ConsentService } from '../consent/consent.service';

function makePoolMock(): Pool {
  return {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  } as unknown as Pool;
}

function makeConsentMock(): jest.Mocked<Pick<ConsentService, 'canTenantAccessVoucher'>> {
  return {
    canTenantAccessVoucher: jest.fn().mockResolvedValue(true),
  };
}

function makeController(
  service: ReturnType<typeof makeServiceMock>,
  launch = createLaunchServiceMock(),
  consent = makeConsentMock(),
  pool = makePoolMock(),
) {
  return new HarvestController(
    service as unknown as HarvestService,
    launch,
    consent as unknown as ConsentService,
    pool,
  );
}

function makeServiceMock(): jest.Mocked<
  Pick<
    HarvestService,
    | 'isFarmerOwnedByUser'
    | 'getPlotFarmerId'
    | 'create'
    | 'listVouchersForFarmer'
    | 'listVouchersForTenant'
    | 'isFarmerInTenant'
    | 'createDdsPackage'
    | 'listDdsPackagesForFarmer'
    | 'canReadPackageForTenant'
    | 'getDdsPackageDetail'
    | 'listDdsPackageEvidenceDocuments'
    | 'evaluateDdsPackageReadiness'
    | 'evaluateDdsPackageRiskScore'
    | 'evaluateDdsPackageFilingPreflight'
    | 'generateDdsPackageArtifacts'
    | 'getDdsPackageTracesJson'
    | 'submitDdsPackage'
    | 'validateShipmentDeclaredWeight'
  >
> {
  return {
    isFarmerOwnedByUser: jest.fn(),
    getPlotFarmerId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    listVouchersForFarmer: jest.fn(),
    listVouchersForTenant: jest.fn(),
    isFarmerInTenant: jest.fn().mockResolvedValue(true),
    createDdsPackage: jest.fn(),
    listDdsPackagesForFarmer: jest.fn(),
    canReadPackageForTenant: jest.fn().mockResolvedValue(true),
    getDdsPackageDetail: jest.fn(),
    listDdsPackageEvidenceDocuments: jest.fn(),
    evaluateDdsPackageReadiness: jest.fn(),
    evaluateDdsPackageRiskScore: jest.fn(),
    evaluateDdsPackageFilingPreflight: jest.fn(),
    generateDdsPackageArtifacts: jest.fn(),
    getDdsPackageTracesJson: jest.fn(),
    submitDdsPackage: jest.fn(),
    validateShipmentDeclaredWeight: jest.fn(),
  };
}

describe('HarvestController scope and role boundaries', () => {
  it('rejects when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackage('pkg_1', { user: { id: 'user_1', email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer create on another farmer profile', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = makeController(service);

    await expect(
      controller.create(
        { farmerId: 'farmer_other', plotId: 'plot_1', kg: 10 } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer voucher list for another farmerId', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = makeController(service);

    await expect(
      controller.listVouchers('farmer_other', 'farmer', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows linked dashboard user to list own farmer vouchers', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(true);
    service.listVouchersForFarmer.mockResolvedValue([{ id: 'v_1', qr_code_ref: 'V-LINKED01' }] as any);
    const pool = makePoolMock();
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{}] });
    const controller = makeController(service, createLaunchServiceMock(), makeConsentMock(), pool);

    await expect(
      controller.listVouchers('farmer_self', 'farmer', {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      }),
    ).resolves.toEqual([{ id: 'v_1', qr_code_ref: 'V-LINKED01' }]);

    expect(service.isFarmerOwnedByUser).toHaveBeenCalledWith('farmer_self', 'user_1');
    expect(service.listVouchersForFarmer).toHaveBeenCalledWith('farmer_self');
  });

  it('rejects non-exporter package detail access', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackage('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects non-exporter package readiness access', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackageReadiness('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects non-exporter package evidence-documents access', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackageEvidenceDocuments('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns package evidence-documents for exporter role', async () => {
    const service = makeServiceMock();
    service.listDdsPackageEvidenceDocuments.mockResolvedValue([
      {
        evidenceId: 'evidence_v_1',
        packageId: 'pkg_1',
        plotId: 'plot_1',
        title: 'South Field document packet',
        type: 'tenure_evidence',
        reviewStatus: 'pending',
        source: 'South Field',
        capturedAt: '2026-04-16',
      },
    ] as any);
    const controller = makeController(service);

    await expect(
      controller.getPackageEvidenceDocuments('pkg_1', {
        user: {
          id: 'user_1',
          email: 'exporter+demo@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
        },
      }),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ evidenceId: 'evidence_v_1', packageId: 'pkg_1' })]),
    );
  });

  it('returns package readiness for exporter role', async () => {
    const service = makeServiceMock();
    service.evaluateDdsPackageReadiness.mockResolvedValue({
      packageId: 'pkg_1',
      status: 'warning_review',
      blockers: [],
      warnings: [{ code: 'RULE-MISSING-HARVEST-DATE', message: 'missing date', severity: 'warning' }],
      checkedAt: '2026-01-01T00:00:00.000Z',
    } as any);
    const controller = makeController(service);

    await expect(
      controller.getPackageReadiness('pkg_1', {
        user: {
          id: 'user_1',
          email: 'exporter+demo@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ packageId: 'pkg_1', status: 'warning_review' }));
  });

  it('rejects non-exporter package risk score access', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackageRiskScore('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns package risk score for exporter role', async () => {
    const service = makeServiceMock();
    service.evaluateDdsPackageRiskScore.mockResolvedValue({
      packageId: 'pkg_1',
      provider: 'internal_v1',
      score: 42,
      band: 'medium',
      reasons: [{ code: 'RISK-MISSING-HARVEST-DATE', message: 'missing date', weight: 10 }],
      scoredAt: '2026-01-01T00:00:00.000Z',
    } as any);
    const controller = makeController(service);

    await expect(
      controller.getPackageRiskScore('pkg_1', {
        user: {
          id: 'user_1',
          email: 'exporter+demo@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ packageId: 'pkg_1', score: 42, band: 'medium' }));
    expect(service.evaluateDdsPackageRiskScore).toHaveBeenCalledWith(
      'pkg_1',
      expect.objectContaining({
        tenantId: 'tenant_1',
        userId: 'user_1',
        exportedBy: 'exporter+demo@tracebud.com',
      }),
    );
  });

  it('rejects non-exporter filing preflight access', async () => {
    const service = makeServiceMock();
    const controller = makeController(service);

    await expect(
      controller.getPackageFilingPreflight('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns filing preflight result for exporter role', async () => {
    const service = makeServiceMock();
    service.evaluateDdsPackageFilingPreflight.mockResolvedValue({
      packageId: 'pkg_1',
      status: 'preflight_ready',
      readinessStatus: 'warning_review',
      riskBand: 'medium',
      riskScore: 42,
      blockerCount: 0,
      warningCount: 1,
      checkedAt: '2026-01-01T00:00:00.000Z',
    } as any);
    const controller = makeController(service);

    await expect(
      controller.getPackageFilingPreflight('pkg_1', {
        user: {
          id: 'user_1',
          email: 'exporter+demo@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ packageId: 'pkg_1', status: 'preflight_ready' }));
  });

  it('returns package generation result for exporter role', async () => {
    const service = makeServiceMock();
    service.generateDdsPackageArtifacts.mockResolvedValue({
      packageId: 'pkg_1',
      status: 'package_generated',
      artifactVersion: 'v1',
      lotCount: 2,
      generatedAt: '2026-01-01T00:00:00.000Z',
    } as any);
    const controller = makeController(service);

    await expect(
      controller.generatePackage('pkg_1', {
        user: {
          id: 'user_1',
          email: 'exporter+demo@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ packageId: 'pkg_1', status: 'package_generated' }));
  });

  it('submits package with idempotency key for exporter role', async () => {
    const service = makeServiceMock();
    service.submitDdsPackage.mockResolvedValue({
      packageId: 'pkg_1',
      idempotencyKey: 'idem-1',
      status: 'submitted',
      submissionState: 'submitted',
      tracesReference: 'TRACES-AAAAAA',
      replayed: false,
      persistedAt: '2026-01-01T00:00:00.000Z',
    } as any);
    const controller = makeController(service);

    await expect(
      controller.submitPackage(
        'pkg_1',
        { idempotencyKey: 'idem-1' } as any,
        {
          user: {
            id: 'user_1',
            email: 'exporter+demo@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ packageId: 'pkg_1', status: 'submitted' }));
  });

  it('returns tenant vouchers for cooperative role', async () => {
    const service = makeServiceMock();
    service.listVouchersForTenant.mockResolvedValue([{ id: 'v_1', qr_code_ref: 'V-ABC12345' }] as any);
    const controller = makeController(service);

    await expect(
      controller.listVouchers(undefined, 'tenant', {
        user: {
          id: 'user_1',
          email: 'coop@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'cooperative' },
        },
      }),
    ).resolves.toEqual({ vouchers: [{ id: 'v_1', qr_code_ref: 'V-ABC12345' }] });

    expect(service.listVouchersForTenant).toHaveBeenCalledWith('tenant_1');
  });

  it('creates package from vouchers for cooperative role with tenant scope', async () => {
    const service = makeServiceMock();
    service.createDdsPackage.mockResolvedValue({ id: 'pkg_1', status: 'draft' } as any);
    const launch = createLaunchServiceMock();
    const controller = makeController(service, launch);

    await expect(
      controller.createPackage(
        { voucherIds: ['11111111-1111-4111-8111-111111111111'] } as any,
        {
          user: {
            id: 'user_1',
            email: 'coop@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'cooperative' },
          },
        },
      ),
    ).resolves.toEqual({ id: 'pkg_1', status: 'draft' });

    expect(service.createDdsPackage).toHaveBeenCalledWith(
      { voucherIds: ['11111111-1111-4111-8111-111111111111'] },
      { tenantId: 'tenant_1' },
    );
  });

  it('rejects shipment weight validation when declared kg does not match batch totals', async () => {
    const service = makeServiceMock();
    service.validateShipmentDeclaredWeight.mockResolvedValue({
      ok: false,
      covered_quantity_kg: 1000,
      declared_quantity_kg: 2000,
      package_weights: [],
      error: 'Declared shipment weight (2000 kg) must match batch lineage total (1000 kg).',
    });
    const controller = makeController(service);

    await expect(
      controller.validateShipmentWeight(
        { packageIds: ['pkg_1'], declaredQuantityKg: 2000 },
        {
          user: {
            id: 'user_1',
            email: 'exporter@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
