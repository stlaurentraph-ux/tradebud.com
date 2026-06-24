import { Module } from '@nestjs/common';
import { ConsentModule } from '../consent/consent.module';
import { DbModule } from '../db/db.module';
import { LaunchModule } from '../launch/launch.module';
import { PlotsController } from './plots.controller';
import { FieldAppController } from './field-app.controller';
import { FieldEnumerationService } from './field-enumeration.service';
import { PlotGeometryValidationService } from './plot-geometry-validation.service';
import { PlotsService } from './plots.service';
import { TenureParseService } from './tenure-parse.service';
import { EvidenceDocumentsService } from './evidence-documents.service';
import { TenureReviewAlertService } from './tenure-review-alert.service';
import { GfwContextService } from '../compliance/gfw-context.service';
import { GfwService } from '../compliance/gfw.service';
import { FdpCommodityService } from '../compliance/fdp-commodity.service';

@Module({
  imports: [DbModule, ConsentModule, LaunchModule],
  controllers: [PlotsController, FieldAppController],
  providers: [
    PlotsService,
    FieldEnumerationService,
    TenureParseService,
    EvidenceDocumentsService,
    TenureReviewAlertService,
    PlotGeometryValidationService,
    GfwService,
    GfwContextService,
    FdpCommodityService,
  ],
})
export class PlotsModule {}

