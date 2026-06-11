import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ConsentPurposeCode, ConsentService } from './consent.service';
import { PushNotificationService } from './push-notification.service';

const ORG_CONSENT_ROLES = [
  'admin',
  'exporter',
  'agent',
  'compliance_manager',
  'cooperative',
  'importer',
] as const;

@ApiTags('Consent')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly pushNotifications: PushNotificationService,
  ) {}

  private requireOrgConsentRole(req: any): void {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (!ORG_CONSENT_ROLES.includes(role as (typeof ORG_CONSENT_ROLES)[number])) {
      throw new ForbiddenException('This role cannot manage producer consent grants');
    }
  }

  @Get('v1/farmers/resolve')
  async resolveFarmerProfile(
    @Query('email') email: string | undefined,
    @Req() req: any,
  ) {
    this.requireOrgConsentRole(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('email query parameter is required');
    }
    const farmerId = await this.consentService.resolveFarmerIdForTenantEmail(
      tenantId,
      normalizedEmail,
    );
    if (!farmerId) {
      throw new NotFoundException(
        'No field-app producer profile linked to this email in your organisation yet',
      );
    }
    return { farmer_id: farmerId, email: normalizedEmail };
  }

  @Get('v1/me/consent-grants')
  async listMine(@Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer') {
      throw new ForbiddenException('Only producers can list their consent grants');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const items = await this.consentService.listForFarmerUser(userId);
    return { items };
  }

  @Post('v1/me/consent-grants/:id/approve')
  async approveMine(@Param('id') id: string, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer') {
      throw new ForbiddenException('Only producers can approve consent grants');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const grant = await this.consentService.approveGrant(id, userId);
    return { consent_grant_id: grant.id, status: grant.status, granted_at: grant.granted_at };
  }

  @Post('v1/me/consent-grants/:id/deny')
  async denyMine(@Param('id') id: string, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer') {
      throw new ForbiddenException('Only producers can deny consent grants');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const grant = await this.consentService.denyGrant(id, userId);
    return { consent_grant_id: grant.id, status: grant.status };
  }

  @Patch('v1/me/consent-grants/:id/revoke')
  async revokeMine(
    @Param('id') id: string,
    @Body() body: { revocation_reason?: string },
    @Req() req: any,
  ) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer') {
      throw new ForbiddenException('Only producers can revoke consent grants');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const grant = await this.consentService.revokeGrant(id, userId, body?.revocation_reason ?? '');
    return {
      consent_grant_id: grant.id,
      status: grant.status,
      revoked_at: grant.revoked_at,
    };
  }

  @Get('v1/farmers/:farmerId/consent-grants')
  async listForFarmer(@Param('farmerId') farmerId: string, @Req() req: any) {
    this.requireOrgConsentRole(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    const items = await this.consentService.listForTenantAndFarmer(tenantId, farmerId);
    return {
      items: items.map((grant) => this.consentService.enrichGrantWithRetention(grant)),
      sold_lineage_retention_years: 5,
    };
  }

  @Post('v1/me/push-devices')
  async registerPushDevice(
    @Body() body: { push_token?: string; platform?: string },
    @Req() req: any,
  ) {
    const role = deriveRoleFromSupabaseUser(req.user);
    const allowedRoles = new Set([
      'farmer',
      'agent',
      'cooperative',
      'exporter',
      'compliance_manager',
    ]);
    if (!role || !allowedRoles.has(role)) {
      throw new ForbiddenException('This account cannot register push devices');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const pushToken = body?.push_token?.trim();
    if (!pushToken) {
      throw new BadRequestException('push_token is required');
    }
    await this.pushNotifications.registerDevice(userId, pushToken, body?.platform ?? 'unknown');
    return { registered: true };
  }

  @Post('v1/me/gdpr-erasure-request')
  async requestGdprErasure(@Body() body: { details?: string }, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer') {
      throw new ForbiddenException('Only producers can request GDPR erasure');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.consentService.recordGdprErasureRequest(userId, body?.details ?? '');
  }

  @Post('v1/farmers/:farmerId/consent-requests')
  async createRequest(
    @Param('farmerId') farmerId: string,
    @Body()
    body: {
      grantee_org_name?: string | null;
      purpose_code?: ConsentPurposeCode;
      data_scope?: string[];
    },
    @Req() req: any,
  ) {
    this.requireOrgConsentRole(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const grant = await this.consentService.createConsentRequest({
      tenantId,
      requesterUserId: userId,
      farmerId,
      granteeOrgName: body?.grantee_org_name,
      purposeCode: body?.purpose_code,
      dataScope: body?.data_scope,
    });
    return {
      consent_grant_id: grant.id,
      status: grant.status,
      farmer_id: grant.farmer_id,
      grantee_tenant_id: grant.grantee_tenant_id,
    };
  }
}
