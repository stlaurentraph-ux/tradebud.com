import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { PlotsModule } from './plots/plots.module';
import { HarvestModule } from './harvest/harvest.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DbModule,
    PlotsModule,
    HarvestModule,
    AuditModule,
    HealthModule,
    ReportsModule,
  ],
})
export class AppModule {}

