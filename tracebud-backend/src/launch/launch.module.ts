import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LaunchService } from './launch.service';
import { LaunchController } from './launch.controller';
import { LaunchPublicController } from './launch.public.controller';

@Module({
  imports: [DbModule],
  providers: [LaunchService],
  controllers: [LaunchController, LaunchPublicController],
  exports: [LaunchService],
})
export class LaunchModule {}
