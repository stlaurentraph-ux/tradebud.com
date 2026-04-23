import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { PlotsModule } from './plots/plots.module';
import { HarvestModule } from './harvest/harvest.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';
import { ChatThreadsModule } from './chat-threads/chat-threads.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WorkflowTemplatesModule } from './workflow-templates/workflow-templates.module';
import { LaunchModule } from './launch/launch.module';
import { AdminModule } from './admin/admin.module';
import { ContactsModule } from './contacts/contacts.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DbModule,
    PlotsModule,
    HarvestModule,
    AuditModule,
    HealthModule,
    ReportsModule,
    ChatThreadsModule,
    IntegrationsModule,
    WorkflowTemplatesModule,
    LaunchModule,
    AdminModule,
    ContactsModule,
    RequestsModule,
  ],
})
export class AppModule {}

