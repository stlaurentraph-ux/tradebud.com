import { ForbiddenException } from '@nestjs/common';
import { ReportsController } from './reports.controller';

function makeResponseMock() {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  };
}

describe('ReportsController role guard', () => {
  it('rejects when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new ReportsController(pool as any);
    const res = makeResponseMock();

    await expect(
      controller.plotsReport('farmer_1', undefined, { user: { email: 'exporter+demo@tracebud.com' } }, res as any),
    ).rejects.toThrow(ForbiddenException);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects plots report for non-exporter users', async () => {
    const pool = { query: jest.fn() };
    const controller = new ReportsController(pool as any);
    const res = makeResponseMock();

    await expect(
      controller.plotsReport(
        'farmer_1',
        undefined,
        { user: { email: 'agent+test@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
        res as any,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects harvest report for non-exporter users', async () => {
    const pool = { query: jest.fn() };
    const controller = new ReportsController(pool as any);
    const res = makeResponseMock();

    await expect(
      controller.harvestsReport(
        'farmer_1',
        undefined,
        undefined,
        undefined,
        { user: { email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
        res as any,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('allows exporter and returns rows', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [{ id: 'plot_1', farmer_id: 'farmer_1' }] }),
    };
    const controller = new ReportsController(pool as any);
    const res = makeResponseMock();

    await controller.plotsReport(
      'farmer_1',
      undefined,
      { user: { email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } } },
      res as any,
    );

    expect(pool.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([{ id: 'plot_1', farmer_id: 'farmer_1' }]);
  });
});
