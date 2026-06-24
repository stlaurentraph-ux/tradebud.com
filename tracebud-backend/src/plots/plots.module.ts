import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { ConsentModule } from '../consent/consent.module';
import { DbModule } from '../db/db.module';
import { LaunchModule } from '../launch/launch.module';
import { BulkPlotImportController } from './bulk-plot-import.controller';
import { BulkPlotImportEvidenceService } from './bulk-plot-import-evidence.service';
import { BulkPlotImportJobService } from './bulk-plot-import-job.service';
import { BulkPlotImportService } from './bulk-plot-import.service';
import { CadastralParcelController } from './cadastral-parcel.controller';
import { CadastralParcelLookupService } from './cadastral-parcel-lookup.service';
import { FieldAppController } from './field-app.controller';
import { PlotGeometryValidationService } from './plot-geometry-validation.service';
import { PlotsController } from './plots.controller';
import { PlotsService } from './plots.service';
import { TenureParseService } from './tenure-parse.service';
import { EvidenceDocumentsService } from './evidence-documents.service';
import { TenureReviewAlertService } from './tenure-review-alert.service';
import { GfwContextService } from '../compliance/gfw-context.service';
import { GfwService } from '../compliance/gfw.service';
import { FdpCommodityService } from '../compliance/fdp-commodity.service';

@Module({
  imports: [DbModule, ConsentModule, LaunchModule, ContactsModule],
  controllers: [
    PlotsController,
    FieldAppController,
    CadastralParcelController,
    BulkPlotImportController,
  ],
  providers: [
    PlotsService,
    BulkPlotImportService,
    BulkPlotImportJobService,
    BulkPlotImportEvidenceService,
    CadastralParcelLookupService,
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
