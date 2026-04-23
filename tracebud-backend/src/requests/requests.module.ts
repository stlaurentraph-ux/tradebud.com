import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { RequestsController } from './requests.controller';
import { RequestsPublicController } from './requests.public.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [DbModule],
  controllers: [RequestsController, RequestsPublicController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}

