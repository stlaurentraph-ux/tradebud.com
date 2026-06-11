import { ConsentService } from './consent.service';

describe('ConsentService', () => {
  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plotId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const voucherId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const tenantA = 'tenant_coop_a';

  function createPool(state: {
    grants: Array<{
      id: string;
      farmer_id: string;
      grantee_tenant_id: string;
      status: string;
      updated_at?: string;
      revoked_at?: string | null;
      data_scope?: string[];
    }>;
    farmerInTenant?: boolean;
    plotInSoldLineage?: boolean;
    voucherInSoldLineage?: boolean;
    hasSoldLineage?: boolean;
  }) {
    return {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        const text = String(sql);
        if (text.includes('FROM consent_grants') && text.includes('ORDER BY updated_at DESC')) {
          const match = state.grants
            .filter((g) => g.farmer_id === params?.[0] && g.grantee_tenant_id === params?.[1])
            .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
          const row = match[0];
          if (text.includes('revoked_at')) {
            return {
              rows: row ? [{ status: row.status, revoked_at: row.revoked_at ?? null }] : [],
              rowCount: row ? 1 : 0,
            };
          }
          if (text.includes('data_scope')) {
            return {
              rows: row ? [{ data_scope: row.data_scope ?? ['identity', 'plots', 'evidence'] }] : [],
              rowCount: row ? 1 : 0,
            };
          }
          return { rows: row ? [{ status: row.status }] : [], rowCount: row ? 1 : 0 };
        }
        if (text.includes('FROM farmer_profile fp') && text.includes('tenant_signup_contacts')) {
          return {
            rows: state.farmerInTenant === false ? [] : [{ farmer_id: farmerId }],
            rowCount: state.farmerInTenant === false ? 0 : 1,
          };
        }
        if (text.includes('SELECT farmer_id FROM plot')) {
          return { rows: [{ farmer_id: farmerId }], rowCount: 1 };
        }
        if (text.includes('SELECT farmer_id FROM voucher')) {
          return { rows: [{ farmer_id: farmerId }], rowCount: 1 };
        }
        if (text.includes('AS sold') && text.includes('ht.plot_id')) {
          return { rows: [{ sold: state.plotInSoldLineage ?? false }], rowCount: 1 };
        }
        if (text.includes('AS sold') && text.includes('dpv.voucher_id')) {
          return { rows: [{ sold: state.voucherInSoldLineage ?? false }], rowCount: 1 };
        }
        if (text.includes('FROM dds_package dp') && text.includes('AS sold')) {
          return { rows: [{ sold: state.hasSoldLineage ?? false }], rowCount: 1 };
        }
        if (text.includes('INSERT INTO audit_log')) {
          return { rows: [], rowCount: 1 };
        }
        throw new Error(`Unexpected query: ${text}`);
      }),
    } as any;
  }

  it('allows new-data access when latest grant is active', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'active',
          updated_at: '2026-06-12T10:00:00.000Z',
        },
      ],
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessFarmerNewData(farmerId, tenantA)).resolves.toBe(true);
  });

  it('blocks new-data access when latest grant is pending', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'pending',
          updated_at: '2026-06-12T11:00:00.000Z',
        },
      ],
      farmerInTenant: true,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessFarmerNewData(farmerId, tenantA)).resolves.toBe(false);
    await expect(service.canTenantAccessPlot(plotId, tenantA)).resolves.toBe(false);
  });

  it('blocks new-data access when latest grant is revoked', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'revoked',
          revoked_at: '2026-06-12T12:00:00.000Z',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      ],
      farmerInTenant: true,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessFarmerNewData(farmerId, tenantA)).resolves.toBe(false);
  });

  it('still allows plot access when revoked but plot is in sold lineage', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'revoked',
          revoked_at: '2026-06-12T12:00:00.000Z',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      ],
      farmerInTenant: true,
      plotInSoldLineage: true,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessPlot(plotId, tenantA)).resolves.toBe(true);
  });

  it('blocks plot access when revoked and plot is not in sold lineage', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'revoked',
          revoked_at: '2026-06-12T12:00:00.000Z',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      ],
      farmerInTenant: true,
      plotInSoldLineage: false,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessPlot(plotId, tenantA)).resolves.toBe(false);
  });

  it('allows farmer relationship when revoked but sold lineage exists', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'revoked',
          revoked_at: '2026-06-12T12:00:00.000Z',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      ],
      farmerInTenant: true,
      hasSoldLineage: true,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessFarmer(farmerId, tenantA)).resolves.toBe(true);
  });

  it('allows sold vouchers after revoke', async () => {
    const pool = createPool({
      grants: [
        {
          id: '1',
          farmer_id: farmerId,
          grantee_tenant_id: tenantA,
          status: 'revoked',
          revoked_at: '2026-06-12T12:00:00.000Z',
          updated_at: '2026-06-12T12:00:00.000Z',
        },
      ],
      farmerInTenant: true,
      voucherInSoldLineage: true,
    });
    const service = new ConsentService(pool);
    await expect(service.canTenantAccessVoucher(voucherId, tenantA)).resolves.toBe(true);
  });
});
