import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

describe('ContactsController', () => {
  const makeReq = (role: string, tenantId = 'tenant_1') => ({
    user: {
      id: 'user_1',
      app_metadata: { role, tenant_id: tenantId },
    },
  });

  it('denies contacts list when role is not allowed', async () => {
    const service = { list: jest.fn() } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(controller.list(makeReq('farmer'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies contacts list when tenant claim is missing', async () => {
    const service = { list: jest.fn() } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(
      controller.list({
        user: { id: 'user_1', app_metadata: { role: 'admin' } },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows contacts list for admin and forwards tenant scope', async () => {
    const service = {
      list: jest.fn().mockResolvedValue([]),
    } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(controller.list(makeReq('admin', 'tenant_abc'))).resolves.toEqual([]);
    expect(service.list).toHaveBeenCalledWith('tenant_abc');
  });

  it('validates create payload before service call', async () => {
    const service = {
      create: jest.fn(),
    } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(controller.create(makeReq('admin'), null as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(service.create).not.toHaveBeenCalled();
  });

  it('validates status payload for transitions endpoint', async () => {
    const service = {
      updateStatus: jest.fn(),
    } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(controller.updateStatus(makeReq('admin'), 'contact_1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('allows status update with valid role and payload', async () => {
    const service = {
      updateStatus: jest.fn().mockResolvedValue({ id: 'contact_1', status: 'engaged' }),
    } as unknown as ContactsService;
    const controller = new ContactsController(service);

    await expect(
      controller.updateStatus(makeReq('exporter', 'tenant_scope'), 'contact_1', { status: 'engaged' }),
    ).resolves.toMatchObject({ id: 'contact_1', status: 'engaged' });
    expect(service.updateStatus).toHaveBeenCalledWith('tenant_scope', 'contact_1', 'engaged');
  });
});

