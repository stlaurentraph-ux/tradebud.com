import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { EudrController } from './eudr.controller';
import { IntegrationsController } from './integrations.controller';
import { YieldBenchmarksController } from './yield-benchmarks.controller';

@Module({
  imports: [DbModule],
  controllers: [IntegrationsController, EudrController, YieldBenchmarksController],
})
export class IntegrationsModule {}

