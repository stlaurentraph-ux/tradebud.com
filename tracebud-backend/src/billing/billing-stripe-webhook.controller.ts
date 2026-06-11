import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { StripeBillingService } from './stripe-billing.service';

@ApiTags('Billing')
@Controller('v1/billing/stripe')
export class BillingStripeWebhookController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeBilling: StripeBillingService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook receiver for invoice payment reconciliation' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') stripeSignature: string | undefined,
  ) {
    if (!this.stripeBilling.isWebhookEnabled()) {
      throw new BadRequestException('Stripe webhooks are not configured.');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body for Stripe webhook verification.');
    }

    const event = this.stripeBilling.constructWebhookEvent(rawBody, stripeSignature);
    const result = await this.billingService.handleStripeWebhookEvent(event);
    return { received: true, ...result };
  }
}
