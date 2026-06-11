import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { DbModule } from '../db/db.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [DbModule, BillingModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}

