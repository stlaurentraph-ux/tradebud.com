import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ReportsController } from './reports.controller';

@Module({
  imports: [DbModule],
  controllers: [ReportsController],
})
export class ReportsModule {}

