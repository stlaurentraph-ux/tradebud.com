import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequestType, RequestsService } from './requests.service';

@ApiTags('Requests')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  private getTenantId(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private requireRequestsAccess(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!['admin', 'exporter', 'compliance_manager'].includes(role)) {
      throw new ForbiddenException('This role cannot access request campaigns.');
    }
  }

  @Get('campaigns')
  async list(@Req() req: any) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    return this.requestsService.list(tenantId);
  }

  @Get('issues')
  async listOperationalIssues(@Req() req: any) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    return this.requestsService.listOperationalIssues(tenantId);
  }

  @Get('evidence-feed')
  async listEvidenceFeed(@Req() req: any) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    return this.requestsService.listEvidenceFeed(tenantId);
  }

  @Post('campaigns')
  async create(
    @Req() req: any,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body()
    body: {
      request_type?: RequestType;
      campaign_name?: string;
      description_template?: string;
      due_date?: string;
      targets?: Array<{
        email?: string | null;
        full_name?: string | null;
        organization?: string | null;
        farmer_id?: string | null;
        plot_id?: string | null;
      }>;
    },
  ) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    const actorUserId = req?.user?.id;
    if (!actorUserId) {
      throw new BadRequestException('Missing authenticated user id');
    }
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid payload.');
    }
    return this.requestsService.create(tenantId, actorUserId, idempotencyKey ?? null, body);
  }

  @Patch('campaigns/:id')
  async updateDraft(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      request_type?: RequestType;
      campaign_name?: string;
      description_template?: string;
      due_date?: string;
      targets?: Array<{
        email?: string | null;
        full_name?: string | null;
        organization?: string | null;
        farmer_id?: string | null;
        plot_id?: string | null;
      }>;
    },
  ) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid payload.');
    }
    return this.requestsService.updateDraft(tenantId, id, body);
  }

  @Post('campaigns/:id/send')
  async sendDraft(@Req() req: any, @Param('id') id: string) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    return this.requestsService.sendDraft(tenantId, id);
  }

  @Get('campaigns/:id/decisions')
  async listDecisions(
    @Req() req: any,
    @Param('id') id: string,
    @Query('decision') decision?: 'all' | 'accept' | 'refuse',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? Number.parseInt(offset, 10) : undefined;
    return this.requestsService.listDecisions(tenantId, id, {
      decision,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
    });
  }

  @Post('campaigns/:id/archive')
  async archiveCampaign(@Req() req: any, @Param('id') id: string) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    return this.requestsService.archiveCampaign(tenantId, id);
  }

  @Post('campaigns/:id/decision-intent')
  async recordDecisionIntent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { decision?: 'accept' | 'refuse' },
  ) {
    this.requireRequestsAccess(req);
    const tenantId = this.getTenantId(req);
    const decision = body?.decision;
    if (decision !== 'accept' && decision !== 'refuse') {
      throw new BadRequestException('decision must be either "accept" or "refuse".');
    }
    return this.requestsService.recordDecisionIntent(tenantId, id, decision);
  }
}

