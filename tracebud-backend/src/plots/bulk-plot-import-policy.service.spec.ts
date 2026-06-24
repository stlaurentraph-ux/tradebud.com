import { BadRequestException } from '@nestjs/common';
import { BulkPlotImportPolicyService } from './bulk-plot-import-policy.service';

describe('BulkPlotImportPolicyService', () => {
  it('blocks unsigned packages when requireSignedPackages is enabled', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            tenant_id: 'tenant_1',
            require_signed_packages: true,
            accept_integrator_signatures: false,
            updated_at: '2026-06-24T10:00:00.000Z',
          },
        ],
      }),
    };
    const service = new BulkPlotImportPolicyService(pool as never);

    await expect(
      service.assertSignedPackagesRequired({
        tenantId: 'tenant_1',
        importPackagePresent: true,
        signatureStatus: 'unsigned',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns default policy when tenant row is missing', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new BulkPlotImportPolicyService(pool as never);
    const policy = await service.getPolicy('tenant_1');
    expect(policy.requireSignedPackages).toBe(false);
    expect(policy.acceptIntegratorSignatures).toBe(false);
  });
});
