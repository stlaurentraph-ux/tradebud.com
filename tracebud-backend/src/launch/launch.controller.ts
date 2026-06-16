import { Body, Controller, ForbiddenException, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  FeatureEntitlementStatus,
  LaunchFeatureKey,
  LaunchService,
  OnboardingRole,
} from './launch.service';

@ApiTags('Launch')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/launch')
export class LaunchController {
  constructor(private readonly launchService: LaunchService) {}

  private getTenantId(req: any): string {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return tenantId;
  }

  private requireAdmin(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'admin') {
      throw new ForbiddenException('Only admins can manage feature entitlements');
    }
  }

  @Get('state')
  @ApiOperation({
    summary: 'Get tenant trial lifecycle state',
  })
  async getState(@Req() req: any): Promise<any> {
    const tenantId = this.getTenantId(req);
    return this.launchService.getLaunchState(tenantId);
  }

  @Get('commercial-profile')
  @ApiOperation({
    summary: 'Get tenant commercial profile from signup onboarding',
  })
  async getCommercialProfile(@Req() req: any): Promise<{ profile: any | null }> {
    const tenantId = this.getTenantId(req);
    const profile = await this.launchService.getCommercialProfile(tenantId);
    return { profile };
  }

  @Patch('supply-chain-roles')
  @ApiOperation({
    summary: 'Update enabled supply chain roles for this tenant',
  })
  async updateSupplyChainRoles(
    @Req() req: any,
    @Body() body: { supplyChainRoles?: string[] },
  ): Promise<{ profile: any }> {
    const tenantId = this.getTenantId(req);
    const profile = await this.launchService.saveSupplyChainRoles({
      tenantId,
      supplyChainRoles: Array.isArray(body.supplyChainRoles) ? body.supplyChainRoles : [],
      actorUserId: (req?.user?.id as string | undefined) ?? null,
    });
    return { profile };
  }

  @Patch('state/upgrade')
  @ApiOperation({
    summary: 'Mark tenant as paid-active',
  })
  async markUpgrade(@Req() req: any): Promise<any> {
    const tenantId = this.getTenantId(req);
    return this.launchService.markPaidActive(tenantId);
  }

  @Get('onboarding')
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'field_operator', 'compliance_manager'] })
  async getOnboarding(
    @Req() req: any,
    @Query('role') roleRaw: OnboardingRole | undefined,
  ) {
    const tenantId = this.getTenantId(req);
    const role: OnboardingRole =
      roleRaw === 'field_operator' || roleRaw === 'compliance_manager' ? roleRaw : 'admin';
    return this.launchService.getOnboardingProgress(tenantId, role);
  }

  @Post('onboarding/complete')
  async completeOnboardingStep(
    @Req() req: any,
    @Body() body: { role?: OnboardingRole; stepKey?: string },
  ) {
    const tenantId = this.getTenantId(req);
    const role: OnboardingRole =
      body.role === 'field_operator' || body.role === 'compliance_manager' ? body.role : 'admin';
    const stepKey = body.stepKey?.trim();
    if (!stepKey) {
      throw new ForbiddenException('stepKey is required');
    }
    return this.launchService.completeOnboardingStep(
      tenantId,
      role,
      stepKey,
      (req?.user?.id as string | undefined) ?? null,
    );
  }

  @Get('entitlements')
  @ApiOperation({
    summary: 'List tenant feature entitlements',
  })
  async listEntitlements(@Req() req: any): Promise<any> {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    return this.launchService.listFeatureEntitlements(tenantId);
  }

  @Patch('entitlements')
  @ApiOperation({
    summary: 'Set tenant feature entitlement',
  })
  async setEntitlement(
    @Req() req: any,
    @Body() body: { feature?: LaunchFeatureKey; entitlementStatus?: FeatureEntitlementStatus },
  ): Promise<any> {
    this.requireAdmin(req);
    const tenantId = this.getTenantId(req);
    const feature = body.feature;
    const entitlementStatus = body.entitlementStatus;
    if (
      feature !== 'dashboard_campaigns' &&
      feature !== 'dashboard_compliance' &&
      feature !== 'dashboard_reporting' &&
      feature !== 'dashboard_exports'
    ) {
      throw new ForbiddenException('feature is required');
    }
    if (
      entitlementStatus !== 'enabled' &&
      entitlementStatus !== 'disabled' &&
      entitlementStatus !== 'trial'
    ) {
      throw new ForbiddenException('entitlementStatus is required');
    }
    return this.launchService.setFeatureEntitlement(
      tenantId,
      feature,
      entitlementStatus,
      (req?.user?.id as string | undefined) ?? null,
    );
  }
}
