import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { WorkflowTemplatesController } from './workflow-templates.controller';

@Module({
  imports: [DbModule],
  controllers: [WorkflowTemplatesController],
})
export class WorkflowTemplatesModule {}

