import { Body, Controller, ForbiddenException, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createClient } from '@supabase/supabase-js';
import {
  LaunchService,
  SignupPrimaryObjective,
  SignupPrimaryRole,
} from './launch.service';

@ApiTags('Launch')
@Controller('v1/launch')
export class LaunchPublicController {
  constructor(private readonly launchService: LaunchService) {}

  private parseRole(roleRaw: unknown): SignupPrimaryRole {
    return roleRaw === 'importer' ||
      roleRaw === 'exporter' ||
      roleRaw === 'compliance_manager' ||
      roleRaw === 'admin'
      ? roleRaw
      : 'admin';
  }

  private parseObjective(value: unknown): SignupPrimaryObjective | null {
    return value === 'prepare_first_due_diligence_package' ||
      value === 'supplier_onboarding' ||
      value === 'risk_screening' ||
      value === 'audit_readiness'
      ? value
      : null;
  }

  private async getUserFromAuthHeader(authHeader: string | undefined): Promise<any> {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ForbiddenException('Authorization header is required.');
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ForbiddenException('Auth is not configured.');
    }
    const token = authHeader.slice('Bearer '.length);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new ForbiddenException('Invalid token.');
    }
    return data.user;
  }

  @Post('signup')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Create account or complete workspace setup',
  })
  async signup(
    @Headers('authorization') authHeader: string | undefined,
    @Body()
    body: {
      stage?: 'create_account' | 'workspace_setup';
      workEmail?: string;
      password?: string;
      fullName?: string;
      organizationName?: string;
      country?: string;
      primaryRole?: SignupPrimaryRole;
    },
  ): Promise<any> {
    const stage = body.stage ?? 'create_account';
    if (stage === 'create_account') {
      const workEmail = body.workEmail?.trim().toLowerCase();
      const password = body.password ?? '';
      const fullName = body.fullName?.trim() ?? '';
      if (!workEmail || !password || !fullName) {
        throw new ForbiddenException('workEmail, password, and fullName are required.');
      }
      return this.launchService.createAccount({
        workEmail,
        password,
        fullName,
      });
    }

    const user = await this.getUserFromAuthHeader(authHeader);
    const tenantId = user?.app_metadata?.tenant_id ?? user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const organizationName = body.organizationName?.trim() ?? '';
    const country = body.country?.trim() ?? '';
    if (!organizationName || !country) {
      throw new ForbiddenException('organizationName and country are required.');
    }
    const primaryRole = this.parseRole(body.primaryRole);
    const profile = await this.launchService.saveWorkspaceSetup({
      tenantId,
      organizationName,
      country,
      primaryRole,
      actorUserId: (user?.id as string | undefined) ?? null,
    });
    return { ok: true, profile };
  }

  @Post('commercial-profile')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Persist optional commercial-profile onboarding attributes',
  })
  async saveCommercialProfile(
    @Headers('authorization') authHeader: string | undefined,
    @Body()
    body: {
      skipped?: boolean;
      teamSize?: string;
      mainCommodity?: string;
      primaryObjective?: SignupPrimaryObjective;
      primaryRole?: SignupPrimaryRole;
    },
  ): Promise<any> {
    const user = await this.getUserFromAuthHeader(authHeader);
    const tenantId = user?.app_metadata?.tenant_id ?? user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const skipped = Boolean(body.skipped);
    const profile = await this.launchService.saveCommercialProfile({
      tenantId,
      primaryRole: this.parseRole(body.primaryRole),
      skipped,
      teamSize: skipped ? null : (body.teamSize?.trim() || null),
      mainCommodity: skipped ? null : (body.mainCommodity?.trim() || null),
      primaryObjective: skipped ? null : this.parseObjective(body.primaryObjective),
      actorUserId: (user?.id as string | undefined) ?? null,
    });
    return { ok: true, profile };
  }
}
