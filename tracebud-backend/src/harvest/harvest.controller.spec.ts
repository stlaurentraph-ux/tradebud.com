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
});
