import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [DbModule],
  controllers: [ConsentController],
  providers: [ConsentService, PushNotificationService],
  exports: [ConsentService, PushNotificationService],
})
export class ConsentModule {}
