import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { ConsentModule } from '../consent/consent.module';
import { DbModule } from '../db/db.module';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { LaunchModule } from '../launch/launch.module';

@Module({
  imports: [DbModule, LaunchModule, BillingModule, ConsentModule],
  controllers: [HarvestController],
  providers: [HarvestService],
  exports: [HarvestService],
})
export class HarvestModule {}

