import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { observePublicPreviewLookup } from '../observability/public-preview-observability';
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
    const startedAt = Date.now();
    const normalized = parseDeliveryQrRef(qrRef);
    if (!normalized) {
      observePublicPreviewLookup({
        surface: 'delivery_receipt',
        ref: qrRef,
        outcome: 'invalid_ref',
        durationMs: Date.now() - startedAt,
      });
      throw new NotFoundException('Delivery receipt not found');
    }
    try {
      const preview = await this.harvestService.getDeliveryPublicPreview(normalized);
      observePublicPreviewLookup({
        surface: 'delivery_receipt',
        ref: normalized,
        outcome: 'found',
        durationMs: Date.now() - startedAt,
      });
      return { preview };
    } catch {
      observePublicPreviewLookup({
        surface: 'delivery_receipt',
        ref: normalized,
        outcome: 'not_found',
        durationMs: Date.now() - startedAt,
      });
      throw new NotFoundException('Delivery receipt not found');
    }
  }

  @Get('delivery-trip-preview/:tripRef')
  @ApiOperation({
    summary: 'Public multi-plot delivery trip preview',
    description: 'Returns all voucher lines for a shared trip QR (`/t/T-…`).',
  })
  async getDeliveryTripPreview(@Param('tripRef') tripRef: string) {
    const startedAt = Date.now();
    const normalized = parseDeliveryTripRef(tripRef);
    if (!normalized) {
      observePublicPreviewLookup({
        surface: 'delivery_trip',
        ref: tripRef,
        outcome: 'invalid_ref',
        durationMs: Date.now() - startedAt,
      });
      throw new NotFoundException('Delivery trip not found');
    }
    try {
      const preview = await this.harvestService.getDeliveryTripPublicPreview(normalized);
      observePublicPreviewLookup({
        surface: 'delivery_trip',
        ref: normalized,
        outcome: 'found',
        durationMs: Date.now() - startedAt,
      });
      return { preview };
    } catch {
      observePublicPreviewLookup({
        surface: 'delivery_trip',
        ref: normalized,
        outcome: 'not_found',
        durationMs: Date.now() - startedAt,
      });
      throw new NotFoundException('Delivery trip not found');
    }
  }
}
