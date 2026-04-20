import { HarvestService } from './harvest.service';

describe('HarvestService.evaluateDdsPackageReadiness', () => {
  it('returns blocked when package has no vouchers', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_1' },
      vouchers: [],
    } as any);

    const result = await service.evaluateDdsPackageReadiness('pkg_1');

    expect(result.packageId).toBe('pkg_1');
    expect(result.status).toBe('blocked');
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'RULE-MISSING-VOUCHERS' })]),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_readiness_requested']),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_readiness_evaluated']),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_readiness_blocked']),
    );
  });

  it('returns warning_review when only warning rules are triggered', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_2' },
      vouchers: [
        {
          id: 'v_1',
          kg: 20,
          harvest_date: null,
          declared_area_ha: null,
        },
      ],
    } as any);

    const result = await service.evaluateDdsPackageReadiness('pkg_2');

    expect(result.status).toBe('warning_review');
    expect(result.blockers).toHaveLength(0);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'RULE-MISSING-HARVEST-DATE' }),
        expect.objectContaining({ code: 'RULE-MISSING-DECLARED-AREA' }),
        expect.objectContaining({ code: 'DOC_MISSING' }),
      ]),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_readiness_warning']),
    );
  });

  it('returns ready_to_submit when no blockers or warnings are found', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_3' },
      vouchers: [
        {
          id: 'v_2',
          kg: 42,
          harvest_date: '2026-04-16',
          declared_area_ha: 1.1,
          plot_name: 'North Parcel',
        },
      ],
    } as any);

    const result = await service.evaluateDdsPackageReadiness('pkg_3');

    expect(result.status).toBe('ready_to_submit');
    expect(result.blockers).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_readiness_passed']),
    );
  });

  it('adds deterministic compliance doc reason codes from voucher state', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_doc_1' },
      vouchers: [
        {
          id: 'v_doc_1',
          kg: 10,
          harvest_date: '2024-01-01',
          declared_area_ha: 1.2,
          status: 'rejected',
          plot_name: '',
        },
      ],
    } as any);

    const result = await service.evaluateDdsPackageReadiness('pkg_doc_1');
    expect(result.status).toBe('blocked');
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'DOC_REJECTED' })]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DOC_SOURCE_MISSING' }),
        expect.objectContaining({ code: 'DOC_STALE' }),
      ]),
    );
  });
});

describe('HarvestService.evaluateDdsPackageRiskScore', () => {
  it('returns high risk when no vouchers are linked', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_risk_1' },
      vouchers: [],
    } as any);

    const result = await service.evaluateDdsPackageRiskScore('pkg_risk_1', { tenantId: 'tenant_1' });
    expect(result.packageId).toBe('pkg_risk_1');
    expect(result.provider).toBe('internal_v1');
    expect(result.band).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'RISK-NO-VOUCHERS' })]));
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_risk_score_requested']),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_risk_score_evaluated']),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_risk_score_high']),
    );
  });

  it('returns low risk when warning-like quality gaps exist', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_risk_2' },
      vouchers: [
        { id: 'v_1', kg: 20, area_ha: 1.5, harvest_date: null, declared_area_ha: 1.5 },
        { id: 'v_2', kg: 18, area_ha: 1.2, harvest_date: '2026-04-16', declared_area_ha: null },
      ],
    } as any);

    const result = await service.evaluateDdsPackageRiskScore('pkg_risk_2', { tenantId: 'tenant_1' });
    expect(result.band).toBe('low');
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'RISK-MISSING-HARVEST-DATE' }),
        expect.objectContaining({ code: 'RISK-MISSING-DECLARED-AREA' }),
      ]),
    );
  });

  it('returns medium risk when yield density exceeds benchmark cap only', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_risk_3' },
      vouchers: [{ id: 'v_3', kg: 10000, area_ha: 1, harvest_date: '2026-04-16', declared_area_ha: 1 }],
    } as any);

    const result = await service.evaluateDdsPackageRiskScore('pkg_risk_3', { tenantId: 'tenant_1' });
    expect(result.band).toBe('medium');
    expect(result.reasons).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'RISK-HIGH-YIELD-DENSITY' })]),
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_risk_score_medium']),
    );
  });
});

describe('HarvestService.evaluateDdsPackageFilingPreflight', () => {
  it('returns preflight_blocked when readiness is blocked', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_file_1' },
      vouchers: [],
    } as any);

    const result = await service.evaluateDdsPackageFilingPreflight('pkg_file_1', { tenantId: 'tenant_1' });
    expect(result.status).toBe('preflight_blocked');
    expect(result.readinessStatus).toBe('blocked');
    expect(result.blockerCount).toBeGreaterThan(0);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_filing_preflight_blocked']),
    );
  });

  it('returns preflight_ready when readiness is not blocked', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_file_2' },
      vouchers: [
        {
          id: 'v_1',
          kg: 10,
          area_ha: 1,
          harvest_date: '2026-04-16',
          declared_area_ha: 1,
          plot_name: 'West Block',
        },
      ],
    } as any);

    const result = await service.evaluateDdsPackageFilingPreflight('pkg_file_2', { tenantId: 'tenant_1' });
    expect(result.status).toBe('preflight_ready');
    expect(result.readinessStatus).toBe('ready_to_submit');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([null, 'dds_package_filing_preflight_ready']),
    );
  });
});

describe('HarvestService filing generation and idempotent submit', () => {
  it('generates package artifacts when preflight is ready', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'pkg_gen_1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }),
    };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'evaluateDdsPackageFilingPreflight').mockResolvedValue({
      packageId: 'pkg_gen_1',
      status: 'preflight_ready',
      readinessStatus: 'ready_to_submit',
      riskBand: 'low',
      riskScore: 10,
      blockerCount: 0,
      warningCount: 0,
      checkedAt: '2026-01-01T00:00:00.000Z',
    });
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_gen_1' },
      vouchers: [{ id: 'v_1' }, { id: 'v_2' }],
    } as any);

    const result = await service.generateDdsPackageArtifacts('pkg_gen_1', { tenantId: 'tenant_1' });
    expect(result.status).toBe('package_generated');
    expect(result.lotCount).toBe(2);
  });

  it('replays submit result for same idempotency key', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              payload: { tracesReference: 'TRACES-REPLAY1' },
              timestamp: '2026-01-01T00:00:00.000Z',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }),
    };
    const service = new HarvestService(pool as any);

    const result = await service.submitDdsPackage('pkg_sub_1', 'idem-1', { tenantId: 'tenant_1' });
    expect(result.replayed).toBe(true);
    expect(result.tracesReference).toBe('TRACES-REPLAY1');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('dds_package_submission_replayed'),
      expect.any(Array),
    );
  });
});

describe('HarvestService.listDdsPackageEvidenceDocuments', () => {
  it('maps vouchers into typed evidence-document rows', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    const service = new HarvestService(pool as any);
    jest.spyOn(service, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_ev_1' },
      vouchers: [
        {
          id: 'v_1',
          status: 'pending_review',
          harvest_date: '2026-04-16',
          plot_id: 'plot_1',
          plot_name: 'North Field A',
          declared_area_ha: null,
        },
      ],
    } as any);

    const rows = await service.listDdsPackageEvidenceDocuments('pkg_ev_1');
    expect(rows).toEqual([
      expect.objectContaining({
        evidenceId: 'evidence_v_1',
        packageId: 'pkg_ev_1',
        plotId: 'plot_1',
        title: 'North Field A document packet',
        type: 'tenure_evidence',
        reviewStatus: 'pending',
        source: 'North Field A',
        capturedAt: '2026-04-16',
      }),
    ]);
  });
});
