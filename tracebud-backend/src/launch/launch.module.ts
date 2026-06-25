import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { InboxModule } from '../inbox/inbox.module';
import { RequestsModule } from '../requests/requests.module';
import { LaunchService } from './launch.service';
import { LaunchController } from './launch.controller';
import { LaunchPublicController } from './launch.public.controller';
import { LaunchCronController } from './launch.cron.controller';
import { OnboardingEmailService } from './onboarding-email.service';

@Module({
  imports: [DbModule, InboxModule, RequestsModule],
  providers: [LaunchService, OnboardingEmailService],
  controllers: [LaunchController, LaunchPublicController, LaunchCronController],
  exports: [LaunchService, OnboardingEmailService],
})
export class LaunchModule {}
