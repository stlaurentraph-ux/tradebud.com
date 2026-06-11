import { createBillingServiceMock } from '../testing/billing-service.mock';
import { HarvestService } from './harvest.service';

describe('HarvestService shared package access', () => {
  it('allows tenant read when farmer belongs to tenant', async () => {
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('FROM dds_package')) {
        return { rows: [{ farmer_id: 'farmer_1' }] };
      }
      if (normalized.includes('FROM tenant_signup_contacts')) {
        return { rows: [{ farmer_id: 'farmer_1' }] };
      }
      return { rows: [] };
    });
    const service = new HarvestService({ query } as any, createBillingServiceMock());
    await expect(service.canReadPackageForTenant('pkg_1', 'tenant_exporter')).resolves.toBe(true);
  });

  it('allows read via inbox grant when farmer is outside tenant', async () => {
    const query = jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('SELECT EXISTS')) {
        return { rows: [{ visible: true }] };
      }
      if (normalized.includes('FROM dds_package') && !normalized.includes('inbox_requests')) {
        return { rows: [{ farmer_id: 'farmer_upstream' }] };
      }
      if (normalized.includes('FROM tenant_signup_contacts')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    const service = new HarvestService({ query } as any, createBillingServiceMock());
    await expect(service.canReadPackageForTenant('pkg_shared', 'tenant_importer')).resolves.toBe(true);
  });
});
