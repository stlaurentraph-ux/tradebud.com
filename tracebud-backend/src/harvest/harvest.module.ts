import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';

@Module({
  imports: [DbModule],
  controllers: [HarvestController],
  providers: [HarvestService],
})
export class HarvestModule {}

