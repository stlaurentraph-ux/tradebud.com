import { BadRequestException } from '@nestjs/common';
import { BulkPlotImportEvidenceService } from './bulk-plot-import-evidence.service';
import type { BulkPlotImportEvidenceItemInput } from './bulk-plot-import.types';

jest.mock('../common/tenant-farmer-scope', () => ({
  isFarmerInTenant: jest.fn().mockResolvedValue(true),
}));

function buildService(deps?: {
  pool?: { query: jest.Mock };
  plotsService?: { syncEvidence: jest.Mock };
  consentService?: { canTenantAccessFarmerEvidence: jest.Mock };
}) {
  return new BulkPlotImportEvidenceService(
    (deps?.pool as never) ?? { query: jest.fn() },
    (deps?.plotsService as never) ?? { syncEvidence: jest.fn().mockResolvedValue({ ok: true }) },
    (deps?.consentService as never) ??
      ({ canTenantAccessFarmerEvidence: jest.fn().mockResolvedValue(true) } as never),
  );
}

const sampleItem = (overrides?: Partial<BulkPlotImportEvidenceItemInput>): BulkPlotImportEvidenceItemInput => ({
  clientPlotId: 'PLOT-001',
  documentRef: 'DOC-001',
  evidenceKind: 'tenure_evidence',
  mimeType: 'application/pdf',
  fileName: 'DOC-001.pdf',
  contentBase64: Buffer.from('land-title-bytes').toString('base64'),
  ...overrides,
});

describe('BulkPlotImportEvidenceService.importEvidence', () => {
  it('rejects empty payloads', async () => {
    const service = buildService();
    await expect(service.importEvidence({ tenantId: 'tenant_1', userId: 'user_1', items: [] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('imports evidence when plot resolves and storage upload succeeds', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [{ plot_id: 'plot_1', farmer_id: 'farmer_1', farmer_user_id: 'auth-user-1' }],
      }),
    };
    const plotsService = { syncEvidence: jest.fn().mockResolvedValue({ ok: true }) };
    const service = buildService({ pool, plotsService });

    jest
      .spyOn(service as unknown as { uploadEvidenceFile: () => Promise<string> }, 'uploadEvidenceFile')
      .mockResolvedValue('auth-user-1/plot_1/tenure_evidence/bulk-DOC-001-DOC-001.pdf');

    const result = await service.importEvidence({
      tenantId: 'tenant_1',
      userId: 'user_1',
      items: [sampleItem()],
    });

    expect(result.importedCount).toBe(1);
    expect(result.rows[0]?.status).toBe('IMPORTED');
    expect(plotsService.syncEvidence).toHaveBeenCalledWith(
      'plot_1',
      expect.objectContaining({ kind: 'tenure_evidence', reason: 'bulk_plot_import_evidence' }),
      'user_1',
      'tenant_1',
    );
  });

  it('returns validation failure when plot is missing', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = buildService({ pool });

    const result = await service.importEvidence({
      tenantId: 'tenant_1',
      userId: 'user_1',
      items: [sampleItem()],
    });

    expect(result.importedCount).toBe(0);
    expect(result.rows[0]?.status).toBe('VALIDATION_FAILED');
    expect(result.rows[0]?.message).toContain('Plot not found');
  });
});
