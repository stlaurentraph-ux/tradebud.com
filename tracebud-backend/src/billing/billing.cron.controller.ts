import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolvePreviousBillingPeriod } from './billing.constants';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('v1/billing')
export class BillingCronController {
  constructor(private readonly billingService: BillingService) {}

  private assertSchedulerToken(tokenRaw: string | undefined): void {
    const expected = process.env.BILLING_SCHEDULER_TOKEN?.trim() ?? '';
    if (!expected) {
      throw new BadRequestException('BILLING_SCHEDULER_TOKEN is not configured.');
    }
    const provided = tokenRaw?.trim() ?? '';
    if (provided.length === 0 || provided !== expected) {
      throw new ForbiddenException('Invalid billing scheduler token.');
    }
  }

  @Post('invoices/finalize-period-cron')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Finalize monthly invoices for the previous calendar month (scheduler/cron)',
  })
  async finalizePreviousPeriod(
    @Headers('x-tracebud-billing-token') billingToken: string | undefined,
  ) {
    this.assertSchedulerToken(billingToken);
    const billingPeriod = resolvePreviousBillingPeriod();
    const result = await this.billingService.finalizeAllTenantInvoicesForPeriod(billingPeriod);
    return {
      billingPeriod,
      invoiceCount: result.invoices.length,
      stripeAttempted: result.stripeAttempted,
      stripeSucceeded: result.stripeSucceeded,
      invoices: result.invoices,
    };
  }
}
