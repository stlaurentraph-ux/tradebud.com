import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AuditController } from './audit.controller';
import { AuditWriteService } from './audit-write.service';

@Module({
  imports: [DbModule],
  controllers: [AuditController],
  providers: [AuditWriteService],
})
export class AuditModule {}

