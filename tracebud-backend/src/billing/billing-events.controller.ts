import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { assertBillingReadRole, requireTenantId, resolveDashboardRole } from './billing-access';
import { BillingService } from './billing.service';

/** OpenAPI alias for spec path `GET /v1/billing-events`. */
@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/billing-events')
export class BillingEventsController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'List metered billing usage events (spec alias)' })
  @ApiQuery({ name: 'period', required: false })
  async listBillingEvents(@Query('period') period: string | undefined, @Req() req: any) {
    const tenantId = requireTenantId(req);
    assertBillingReadRole(resolveDashboardRole(req.user));

    const items = await this.billingService.listUsageMeters(tenantId, period);
    return { items, period: period?.trim() || undefined };
  }
}
