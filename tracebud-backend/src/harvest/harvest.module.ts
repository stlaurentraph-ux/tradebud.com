import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { LaunchModule } from '../launch/launch.module';

@Module({
  imports: [DbModule, LaunchModule],
  controllers: [HarvestController],
  providers: [HarvestService],
})
export class HarvestModule {}

