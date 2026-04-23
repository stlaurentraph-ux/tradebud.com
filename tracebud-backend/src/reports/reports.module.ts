import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ReportsController } from './reports.controller';
import { LaunchModule } from '../launch/launch.module';

@Module({
  imports: [DbModule, LaunchModule],
  controllers: [ReportsController],
})
export class ReportsModule {}

