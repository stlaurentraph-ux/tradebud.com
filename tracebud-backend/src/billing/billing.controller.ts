import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  assertBillingReadRole,
  requireTenantId,
  resolveDashboardRole,
} from './billing-access';
import { BillingService } from './billing.service';
import { BillingSubscriptionBandService } from './billing-subscription-band.service';

const ORIGIN_METER_ROLES = new Set(['exporter', 'cooperative', 'admin', 'compliance_manager']);
const DESTINATION_METER_ROLES = new Set(['importer', 'compliance_manager', 'admin']);

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly subscriptionBandService: BillingSubscriptionBandService,
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'List metered billing usage events for the current billing period' })
  @ApiQuery({ name: 'period', required: false, description: 'Billing period YYYY-MM' })
  async listBillingEvents(@Query('period') period: string | undefined, @Req() req: any) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));

    const items = await this.billingService.listUsageMeters(tenantId, period);
    return { items, period: period?.trim() || undefined };
  }

  @Get('subscription-band')
  @ApiOperation({
    summary: 'Subscription band status from managed contact count (Starter/Growth/Scale/Enterprise)',
  })
  async getSubscriptionBand(@Req() req: any) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));
    const status = await this.subscriptionBandService.getSubscriptionBandStatus(tenantId);
    return { status };
  }

  @Post('assess-contact-capacity')
  @ApiOperation({ summary: 'Check whether additional managed contacts can be added' })
  async assessContactCapacity(
    @Body() body: { additionalContacts?: number },
    @Req() req: any,
  ) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));
    const additionalContacts = Number(body.additionalContacts ?? 1);
    const assessment = await this.subscriptionBandService.assessContactCapacity(
      tenantId,
      Number.isFinite(additionalContacts) && additionalContacts > 0 ? additionalContacts : 1,
    );
    return { assessment };
  }

  @Post('accept-band-upgrade')
  @ApiOperation({
    summary: 'Accept subscription band upgrade (billing changes next calendar month)',
  })
  async acceptBandUpgrade(
    @Body() body: { targetBand?: string },
    @Req() req: any,
  ) {
    const tenantId = requireTenantId(req);
    const role = resolveDashboardRole(req.user);
    if (!['admin', 'compliance_manager'].includes(role)) {
      throw new ForbiddenException('Only admins can accept subscription band upgrades.');
    }

    const status = await this.subscriptionBandService.acceptBandUpgrade(
      tenantId,
      body.targetBand?.trim(),
    );
    return { status };
  }

  @Get('adoption-promo')
  @ApiOperation({ summary: 'Adoption promo status (3 months free + first seal/submit waived)' })
  async getAdoptionPromo(@Req() req: any) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));
    const promo = await this.billingService.getAdoptionPromoStatus(tenantId);
    return { promo };
  }

  @Get('usage-summary')
  @ApiOperation({
    summary: 'Current-period usage summary (subscription + origin seals + destination submits)',
  })
  @ApiQuery({ name: 'period', required: false, description: 'Billing period YYYY-MM' })
  async getUsageSummary(@Query('period') period: string | undefined, @Req() req: any) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));

    return this.billingService.getUsageSummary(tenantId, period);
  }

  @Post('usage-meters/origin-seal')
  @ApiOperation({ summary: 'Meter €1 origin seal usage for a shipment header (idempotent)' })
  async recordOriginSeal(
    @Body() body: { shipmentHeaderId?: string; sponsorTenantId?: string },
    @Req() req: any,
  ) {
    const tenantId = requireTenantId(req);
    const role = resolveDashboardRole(req.user);
    if (!ORIGIN_METER_ROLES.has(role)) {
      throw new ForbiddenException('Only origin operators can meter shipment seal usage.');
    }

    const shipmentHeaderId = body.shipmentHeaderId?.trim();
    if (!shipmentHeaderId) {
      throw new BadRequestException('shipmentHeaderId is required.');
    }

    const meter = await this.billingService.recordOriginSealMeter(tenantId, shipmentHeaderId, {
      sponsorTenantId: body.sponsorTenantId?.trim() || undefined,
    });

    return { meter };
  }

  @Post('usage-meters/destination-submit')
  @ApiOperation({ summary: 'Meter €1 destination DDS submit usage (idempotent)' })
  async recordDestinationSubmit(
    @Body()
    body: {
      shipmentHeaderId?: string;
      ddsRecordId?: string;
      sponsorTenantId?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = requireTenantId(req);
    const role = resolveDashboardRole(req.user);
    if (!DESTINATION_METER_ROLES.has(role)) {
      throw new ForbiddenException('Only destination operators can meter DDS submit usage.');
    }

    const shipmentHeaderId = body.shipmentHeaderId?.trim();
    const ddsRecordId = body.ddsRecordId?.trim();
    if (!shipmentHeaderId || !ddsRecordId) {
      throw new BadRequestException('shipmentHeaderId and ddsRecordId are required.');
    }

    const meter = await this.billingService.recordDestinationSubmitMeter(
      tenantId,
      shipmentHeaderId,
      ddsRecordId,
      { sponsorTenantId: body.sponsorTenantId?.trim() || undefined },
    );

    return { meter };
  }

  @Post('invoices/finalize')
  @ApiOperation({
    summary: 'Finalize a monthly invoice (subscription + metered usage) for a tenant period',
  })
  async finalizeInvoice(
    @Body() body: { billingPeriod?: string; subscriptionAmountEur?: number; tenantId?: string },
    @Req() req: any,
  ) {
    const role = resolveDashboardRole(req.user);
    if (role !== 'admin') {
      throw new ForbiddenException('Only admins can finalize monthly invoices.');
    }

    const billingPeriod = body.billingPeriod?.trim();
    if (!billingPeriod) {
      throw new BadRequestException('billingPeriod is required.');
    }

    // Bind the invoice to the caller's own tenant. A tenant admin must not finalize
    // invoices for another tenant via body.tenantId; platform-wide finalize runs go
    // through the scheduler-token-gated `invoices/finalize-period` endpoint instead.
    const callerTenantId = requireTenantId(req);
    const requestedTenantId = body.tenantId?.trim();
    if (requestedTenantId && requestedTenantId !== callerTenantId) {
      throw new ForbiddenException(
        'Cannot finalize invoices for another tenant. Use the finalize-period endpoint for platform-wide runs.',
      );
    }
    const tenantId = callerTenantId;
    const subscriptionAmountEur = Number(body.subscriptionAmountEur ?? 0);

    const invoice = await this.billingService.finalizeMonthlyInvoice(
      tenantId,
      billingPeriod,
      Number.isFinite(subscriptionAmountEur) ? subscriptionAmountEur : 0,
    );

    return { invoice };
  }

  @Post('invoices/finalize-period')
  @ApiOperation({
    summary: 'Finalize monthly invoices for all tenants with metered usage in a period',
  })
  async finalizePeriod(
    @Body() body: { billingPeriod?: string },
    @Headers('x-tracebud-billing-token') billingToken: string | undefined,
    @Req() req: any,
  ) {
    const role = resolveDashboardRole(req.user);
    const schedulerToken = process.env.BILLING_SCHEDULER_TOKEN?.trim();
    const tokenAuthorized = Boolean(schedulerToken && billingToken === schedulerToken);
    if (!tokenAuthorized && role !== 'admin') {
      throw new ForbiddenException('Admin or scheduler token required to finalize billing period.');
    }

    const billingPeriod = body.billingPeriod?.trim();
    if (!billingPeriod) {
      throw new BadRequestException('billingPeriod is required.');
    }

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
