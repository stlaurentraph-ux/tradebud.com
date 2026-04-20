import { ForbiddenException } from '@nestjs/common';
import { HarvestController } from './harvest.controller';
import type { HarvestService } from './harvest.service';

function makeServiceMock(): jest.Mocked<
  Pick<
    HarvestService,
    | 'isFarmerOwnedByUser'
    | 'create'
    | 'listVouchersForFarmer'
    | 'createDdsPackage'
    | 'listDdsPackagesForFarmer'
    | 'getDdsPackageDetail'
    | 'listDdsPackageEvidenceDocuments'
    | 'evaluateDdsPackageReadiness'
    | 'evaluateDdsPackageRiskScore'
    | 'evaluateDdsPackageFilingPreflight'
    | 'generateDdsPackageArtifacts'
    | 'getDdsPackageTracesJson'
    | 'submitDdsPackage'
  >
> {
  return {
    isFarmerOwnedByUser: jest.fn(),
    create: jest.fn(),
    listVouchersForFarmer: jest.fn(),
    createDdsPackage: jest.fn(),
    listDdsPackagesForFarmer: jest.fn(),
    getDdsPackageDetail: jest.fn(),
    listDdsPackageEvidenceDocuments: jest.fn(),
    evaluateDdsPackageReadiness: jest.fn(),
    evaluateDdsPackageRiskScore: jest.fn(),
    evaluateDdsPackageFilingPreflight: jest.fn(),
    generateDdsPackageArtifacts: jest.fn(),
    getDdsPackageTracesJson: jest.fn(),
    submitDdsPackage: jest.fn(),
  };
}

describe('HarvestController scope and role boundaries', () => {
  it('rejects when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new HarvestController(service as unknown as HarvestService);

    await expect(
      controller.getPackage('pkg_1', { user: { id: 'user_1', email: 'exporter+demo@tracebud.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer create on another farmer profile', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

    await expect(
      controller.listVouchers('farmer_other', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects non-exporter package detail access', async () => {
    const service = makeServiceMock();
    const controller = new HarvestController(service as unknown as HarvestService);

    await expect(
      controller.getPackage('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects non-exporter package readiness access', async () => {
    const service = makeServiceMock();
    const controller = new HarvestController(service as unknown as HarvestService);

    await expect(
      controller.getPackageReadiness('pkg_1', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects non-exporter package evidence-documents access', async () => {
    const service = makeServiceMock();
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
    const controller = new HarvestController(service as unknown as HarvestService);

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
});
