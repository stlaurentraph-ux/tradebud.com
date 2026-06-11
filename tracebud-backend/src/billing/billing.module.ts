import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { BillingController } from './billing.controller';
import { BillingCronController } from './billing.cron.controller';
import { BillingStripeWebhookController } from './billing-stripe-webhook.controller';
import { BillingEventsController } from './billing-events.controller';
import { BillingAdoptionPromoService } from './billing-adoption-promo.service';
import { BillingManagedContactsService } from './billing-managed-contacts.service';
import { BillingSubscriptionBandService } from './billing-subscription-band.service';
import { BillingSubscriptionResolverService } from './billing-subscription-resolver.service';
import { BillingService } from './billing.service';
import { StripeBillingService } from './stripe-billing.service';

@Module({
  imports: [DbModule],
  controllers: [
    BillingController,
    BillingCronController,
    BillingEventsController,
    BillingStripeWebhookController,
  ],
  providers: [
    BillingAdoptionPromoService,
    BillingManagedContactsService,
    BillingSubscriptionResolverService,
    BillingSubscriptionBandService,
    StripeBillingService,
    BillingService,
  ],
  exports: [
    BillingAdoptionPromoService,
    BillingManagedContactsService,
    BillingSubscriptionBandService,
    BillingSubscriptionResolverService,
    BillingService,
  ],
})
export class BillingModule {}
