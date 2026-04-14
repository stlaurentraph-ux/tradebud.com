import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [DbModule],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
