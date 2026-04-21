import { Module } from '@nestjs/common';
import { AssessmentRequestsController } from './assessment-requests.controller';
import { DbModule } from '../db/db.module';
import { CoolFarmSaiV2Controller } from './coolfarm-sai-v2.controller';
import { EudrController } from './eudr.controller';
import { IntegrationsController } from './integrations.controller';
import { PartnerDataController } from './partner-data.controller';
import { YieldBenchmarksController } from './yield-benchmarks.controller';

@Module({
  imports: [DbModule],
  controllers: [
    IntegrationsController,
    EudrController,
    YieldBenchmarksController,
    CoolFarmSaiV2Controller,
    PartnerDataController,
    AssessmentRequestsController,
  ],
})
export class IntegrationsModule {}

