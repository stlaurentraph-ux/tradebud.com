import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ConsentModule } from '../consent/consent.module';
import { InboxModule } from '../inbox/inbox.module';
import { PlotsModule } from '../plots/plots.module';
import { RequestsController } from './requests.controller';
import { RequestsPublicController } from './requests.public.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [DbModule, InboxModule, ConsentModule, PlotsModule],
  controllers: [RequestsController, RequestsPublicController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}

