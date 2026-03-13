import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PlotsController } from './plots.controller';
import { PlotsService } from './plots.service';

@Module({
  imports: [DbModule],
  controllers: [PlotsController],
  providers: [PlotsService],
})
export class PlotsModule {}

