import { ForbiddenException } from '@nestjs/common';
import { PlotsController } from './plots.controller';
import type { PlotsService } from './plots.service';

function makeServiceMock(): jest.Mocked<
  Pick<
    PlotsService,
    | 'isFarmerOwnedByUser'
    | 'isPlotOwnedByUser'
    | 'create'
    | 'listByFarmer'
    | 'updateMetadata'
    | 'syncPhotos'
    | 'syncLegal'
    | 'syncEvidence'
    | 'runGfwCheck'
    | 'getComplianceHistory'
    | 'runComplianceCheck'
  >
> {
  return {
    isFarmerOwnedByUser: jest.fn(),
    isPlotOwnedByUser: jest.fn(),
    create: jest.fn(),
    listByFarmer: jest.fn(),
    updateMetadata: jest.fn(),
    syncPhotos: jest.fn(),
    syncLegal: jest.fn(),
    syncEvidence: jest.fn(),
    runGfwCheck: jest.fn(),
    getComplianceHistory: jest.fn(),
    runComplianceCheck: jest.fn(),
  };
}

describe('PlotsController scope boundaries', () => {
  it('rejects when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.listByFarmer('farmer_1', { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer list for another farmerId', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.listByFarmer('farmer_other', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer plot metadata update for foreign plot', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.updateMetadata(
        'plot_1',
        { reason: 'fix name' } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
