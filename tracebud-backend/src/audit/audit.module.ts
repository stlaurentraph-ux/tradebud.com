import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AuditController } from './audit.controller';

@Module({
  imports: [DbModule],
  controllers: [AuditController],
})
export class AuditModule {}

