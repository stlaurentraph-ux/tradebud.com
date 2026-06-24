import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { parseDeliveryQrRef, parseDeliveryTripRef } from './delivery-qr-ref';
import { HarvestService } from './harvest.service';

@ApiTags('Harvest (public)')
@Controller('v1/public/harvest')
export class HarvestPublicController {
  constructor(private readonly harvestService: HarvestService) {}

  @Get('delivery-preview/:qrRef')
  @ApiOperation({
    summary: 'Public delivery receipt preview for smart-link QR scans',
    description:
      'Returns non-sensitive summary for a voucher QR code. Used by marketing /d/[ref] pages before sign-in.',
  })
  async getDeliveryPreview(@Param('qrRef') qrRef: string) {
    const normalized = parseDeliveryQrRef(qrRef);
    if (!normalized) {
      throw new NotFoundException('Delivery receipt not found');
    }
    try {
      const preview = await this.harvestService.getDeliveryPublicPreview(normalized);
      return { preview };
    } catch {
      throw new NotFoundException('Delivery receipt not found');
    }
  }

  @Get('delivery-trip-preview/:tripRef')
  @ApiOperation({
    summary: 'Public multi-plot delivery trip preview',
    description: 'Returns all voucher lines for a shared trip QR (`/t/T-…`).',
  })
  async getDeliveryTripPreview(@Param('tripRef') tripRef: string) {
    const normalized = parseDeliveryTripRef(tripRef);
    if (!normalized) {
      throw new NotFoundException('Delivery trip not found');
    }
    try {
      const preview = await this.harvestService.getDeliveryTripPublicPreview(normalized);
      return { preview };
    } catch {
      throw new NotFoundException('Delivery trip not found');
    }
  }
}
