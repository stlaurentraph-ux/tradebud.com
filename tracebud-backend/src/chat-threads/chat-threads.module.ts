import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ChatThreadsController } from './chat-threads.controller';
import { ChatThreadsService } from './chat-threads.service';

@Module({
  imports: [DbModule],
  controllers: [ChatThreadsController],
  providers: [ChatThreadsService],
  exports: [ChatThreadsService],
})
export class ChatThreadsModule {}
