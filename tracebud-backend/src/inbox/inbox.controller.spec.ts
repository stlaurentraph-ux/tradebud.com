import { ForbiddenException } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import type { InboxService } from './inbox.service';

function makeServiceMock(): jest.Mocked<Pick<InboxService, 'list' | 'respond' | 'bootstrap'>> {
  return {
    list: jest.fn(),
    respond: jest.fn(),
    bootstrap: jest.fn(),
  };
}

describe('InboxController auth and tenant claim checks', () => {
  it('rejects list when signed tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new InboxController(service as unknown as InboxService);

    await expect(controller.list({ user: { email: 'exporter@tracebud.com' } })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('uses signed claim tenant and calls service with tenant scope', async () => {
    const service = makeServiceMock();
    service.list.mockResolvedValue([]);
    const controller = new InboxController(service as unknown as InboxService);

    await controller.list({ user: { app_metadata: { tenant_id: 'tenant_rwanda_001' } } });
    expect(service.list).toHaveBeenCalledWith('tenant_rwanda_001');
  });

  it('rejects respond when signed tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new InboxController(service as unknown as InboxService);

    await expect(controller.respond('req_1', { user: { email: 'exporter@tracebud.com' } })).rejects.toThrow(
      'Missing required tenant claim (tenant_id) in signed auth token.',
    );
  });

  it('rejects bootstrap when role is not exporter', async () => {
    const service = makeServiceMock();
    const controller = new InboxController(service as unknown as InboxService);

    await expect(
      controller.bootstrap(
        { action: 'reset' },
        { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow('Only exporter/admin users can run inbox bootstrap actions.');
  });

  it('allows bootstrap for exporter role with signed tenant claim', async () => {
    const service = makeServiceMock();
    service.bootstrap.mockResolvedValue(undefined);
    const controller = new InboxController(service as unknown as InboxService);

    const result = await controller.bootstrap(
      { action: 'seed_first_customer' },
      { user: { app_metadata: { tenant_id: 'tenant_rwanda_001' }, email: 'exporter+demo@tracebud.com' } },
    );

    expect(result).toEqual({ ok: true });
    expect(service.bootstrap).toHaveBeenCalledWith('seed_first_customer');
  });
});
