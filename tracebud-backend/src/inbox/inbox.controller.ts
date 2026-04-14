import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { InboxService } from './inbox.service';

type SupabaseUserLike = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

@ApiTags('Inbox Requests')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/inbox-requests')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  private resolveTenantId(user: SupabaseUserLike): string | null {
    const appTenant = typeof user.app_metadata?.tenant_id === 'string' ? user.app_metadata.tenant_id : null;
    if (appTenant && appTenant.trim().length > 0) return appTenant;
    const userTenant = typeof user.user_metadata?.tenant_id === 'string' ? user.user_metadata.tenant_id : null;
    if (userTenant && userTenant.trim().length > 0) return userTenant;
    return null;
  }

  private requireTenantId(req: { user?: SupabaseUserLike }): string {
    const tenantId = this.resolveTenantId(req.user ?? {});
    if (!tenantId) {
      throw new ForbiddenException('Missing required tenant claim (tenant_id) in signed auth token.');
    }
    return tenantId;
  }

  @Get()
  @ApiOperation({ summary: 'List inbox requests for tenant' })
  async list(@Req() req: { user?: SupabaseUserLike }) {
    const tenantId = this.requireTenantId(req);
    const requests = await this.inboxService.list(tenantId);
    return { requests };
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Mark inbox request as responded' })
  @ApiParam({ name: 'id', required: true })
  async respond(@Param('id') id: string, @Req() req: { user?: SupabaseUserLike }) {
    const tenantId = this.requireTenantId(req);
    const request = await this.inboxService.respond(id, tenantId);
    return { request };
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Reset/seed inbox requests for demo flows' })
  async bootstrap(
    @Body() body: { action?: 'reset' | 'seed_first_customer' | 'seed_golden_path' },
    @Req() req: { user?: SupabaseUserLike }
  ) {
    this.requireTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user ?? {});
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporter/admin users can run inbox bootstrap actions.');
    }
    if (!body.action) return { ok: false };
    await this.inboxService.bootstrap(body.action);
    return { ok: true };
  }
}
