import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { DbModule } from '../db/db.module';
import { HarvestModule } from '../harvest/harvest.module';
import { ShipmentHeadersController } from './shipment-headers.controller';
import { ShipmentHeadersService } from './shipment-headers.service';

@Module({
  imports: [DbModule, HarvestModule, BillingModule],
  controllers: [ShipmentHeadersController],
  providers: [ShipmentHeadersService],
  exports: [ShipmentHeadersService],
})
export class ShipmentHeadersModule {}
