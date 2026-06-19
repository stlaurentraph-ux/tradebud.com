import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { resolveFieldActorRole, assertTenantClaimOrFieldActor } from '../auth/field-app-auth';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { ClaimVoucherDto } from './dto/claim-voucher.dto';
import { HarvestService } from './harvest.service';
import { CreateDdsPackageDto } from './dto/create-dds-package.dto';
import { SubmitDdsPackageDto } from './dto/submit-dds-package.dto';
import { DdsPackageEvidenceDocumentDto } from './dto/dds-package-evidence-document.dto';
import { LaunchService } from '../launch/launch.service';
import { resolveDashboardRole } from '../billing/billing-access';
import { ConsentService } from '../consent/consent.service';

const DASHBOARD_HARVEST_ROLES = new Set(['exporter', 'cooperative', 'compliance_manager', 'admin']);

@ApiTags('Harvest')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/harvest')
export class HarvestController {
  constructor(
    private readonly harvestService: HarvestService,
    private readonly launchService: LaunchService,
    private readonly consentService: ConsentService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  private async filterVouchersForTenantAccess(
    tenantId: string,
    vouchers: Array<{ id: string }>,
  ): Promise<typeof vouchers> {
    const allowed = await Promise.all(
      vouchers.map(async (voucher) => ({
        voucher,
        ok: await this.consentService.canTenantAccessVoucher(voucher.id, tenantId),
      })),
    );
    return allowed.filter((row) => row.ok).map((row) => row.voucher);
  }

  private assertDashboardHarvestRole(role: string): void {
    if (!DASHBOARD_HARVEST_ROLES.has(role)) {
      throw new ForbiddenException('Only organisation operators can access tenant harvest data');
    }
  }

  private requireTenantClaim(req: any) {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
  }

  private getTenantId(req: any): string {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return tenantId;
  }

  private async enforcePackageReadAccess(packageId: string, req: any): Promise<void> {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (!['exporter', 'cooperative', 'admin', 'compliance_manager'].includes(role)) {
      throw new ForbiddenException('Only organisation operators can view DDS package details');
    }
    if (role === 'admin') {
      return;
    }
    const allowed = await this.harvestService.canReadPackageForTenant(packageId, tenantId);
    if (!allowed) {
      throw new ForbiddenException('Package scope violation');
    }
  }

  @Post()
  async create(@Body() dto: CreateHarvestDto, @Req() req: any) {
    await assertTenantClaimOrFieldActor(this.pool, req.user);
    const userId = req.user?.id as string | undefined;
    const role = await resolveFieldActorRole(this.pool, req.user);
    if (!role) {
      throw new ForbiddenException('Only farmers or agents can record harvests');
    }
    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      let owned = await this.harvestService.isFarmerOwnedByUser(dto.farmerId, userId);
      if (!owned) {
        const plotFarmerId = await this.harvestService.getPlotFarmerId(dto.plotId);
        if (plotFarmerId) {
          owned = await this.harvestService.isFarmerOwnedByUser(plotFarmerId, userId);
        }
      }
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    }
    return this.harvestService.create(dto, userId);
  }

  @Get('vouchers')
  @ApiQuery({ name: 'farmerId', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['tenant', 'farmer'] })
  async listVouchers(
    @Query('farmerId') farmerId: string | undefined,
    @Query('scope') scope: string | undefined,
    @Req() req: any,
  ) {
    const jwtRole = deriveRoleFromSupabaseUser(req.user);
    const fieldRole = await resolveFieldActorRole(this.pool, req.user);
    const isDashboardOperator =
      jwtRole === 'admin' || DASHBOARD_HARVEST_ROLES.has(jwtRole);
    const resolvedScope = scope === 'tenant' || !farmerId?.trim() ? 'tenant' : 'farmer';

    if (resolvedScope === 'tenant') {
      const tenantId = this.getTenantId(req);
      if (fieldRole === 'farmer' && !isDashboardOperator) {
        throw new ForbiddenException('Farmers must provide farmerId scope');
      }
      this.assertDashboardHarvestRole(jwtRole);
      const vouchers = await this.harvestService.listVouchersForTenant(tenantId);
      const scoped = await this.filterVouchersForTenantAccess(tenantId, vouchers);
      return { vouchers: scoped };
    }

    const scopedFarmerId = farmerId?.trim();
    if (!scopedFarmerId) {
      throw new ForbiddenException('farmerId is required when scope=farmer');
    }

    await assertTenantClaimOrFieldActor(this.pool, req.user);

    if (fieldRole === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.harvestService.isFarmerOwnedByUser(scopedFarmerId, userId);
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    } else if (jwtRole !== 'admin') {
      this.assertDashboardHarvestRole(jwtRole);
      const tenantId = this.getTenantId(req);
      const inTenant = await this.harvestService.isFarmerInTenant(scopedFarmerId, tenantId);
      if (!inTenant) {
        throw new ForbiddenException('Farmer scope violation');
      }
      const vouchers = await this.harvestService.listVouchersForFarmer(scopedFarmerId);
      const scoped = await this.filterVouchersForTenantAccess(tenantId, vouchers);
      if (scoped.length === 0 && vouchers.length > 0) {
        throw new ForbiddenException('CONSENT_REQUIRED');
      }
      return { vouchers: scoped };
    }

    return this.harvestService.listVouchersForFarmer(scopedFarmerId);
  }

  @Get('vouchers/by-qr')
  @ApiOperation({
    summary: 'Lookup voucher by QR reference',
    description:
      'Used by the offline app to validate a voucher QR code and see whether it is active/used and which DDS package (if any) it belongs to.',
  })
  @ApiQuery({ name: 'qrRef', required: true, description: 'Voucher qr_code_ref (e.g. V-ABC12345)' })
  async getVoucherByQr(@Query('qrRef') qrRef: string) {
    return this.harvestService.getVoucherByQrRef(qrRef);
  }

  @Post('vouchers/claim')
  @ApiOperation({
    summary: 'Claim a voucher into the buyer tenant queue',
    description:
      'Registers a field voucher for intake when the buyer scans or types the code. Required when the producer did not direct delivery to this buyer.',
  })
  async claimVoucher(@Body() dto: ClaimVoucherDto, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    this.assertDashboardHarvestRole(role);
    const userId = req.user?.id as string | undefined;
    const lookup = await this.harvestService.getVoucherByQrRef(dto.qrRef);
    const allowed = await this.consentService.canTenantAccessVoucher(lookup.voucher.id, tenantId);
    if (!allowed) {
      throw new ForbiddenException('CONSENT_REQUIRED');
    }
    const voucher = await this.harvestService.claimVoucherForTenant(tenantId, dto.qrRef, userId);
    return { voucher };
  }

  @Post('packages')
  async createPackage(@Body() dto: CreateDdsPackageDto, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const userId = req.user?.id as string | undefined;

    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      return this.harvestService.createDdsPackage(dto, { userId });
    }

    if (!DASHBOARD_HARVEST_ROLES.has(role)) {
      throw new ForbiddenException('Only organisation operators can create DDS packages');
    }

    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_campaigns');
    return this.harvestService.createDdsPackage(dto, { tenantId });
  }

  @Post('shipment-weight/validate')
  @ApiOperation({
    summary: 'Validate declared shipment weight against batch voucher totals',
    description:
      'Ensures the exporter-declared shipment quantity matches the sum of harvest kg on vouchers in the selected batches.',
  })
  async validateShipmentWeight(
    @Body() body: { packageIds?: string[]; declaredQuantityKg?: number },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    this.assertDashboardHarvestRole(role);

    const packageIds = Array.isArray(body.packageIds) ? body.packageIds : [];
    const declaredQuantityKg = Number(body.declaredQuantityKg);

    const result = await this.harvestService.validateShipmentDeclaredWeight(
      tenantId,
      packageIds,
      declaredQuantityKg,
    );

    if (!result.ok) {
      throw new BadRequestException(result.error ?? 'Shipment weight does not match batch lineage.');
    }

    return result;
  }

  @Get('packages')
  @ApiQuery({ name: 'farmerId', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['tenant', 'shared', 'farmer'] })
  async listPackages(
    @Query('farmerId') farmerId: string | undefined,
    @Query('scope') scope: string | undefined,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const resolvedScope =
      scope === 'shared' ? 'shared' : scope === 'tenant' || !farmerId?.trim() ? 'tenant' : 'farmer';

    if (resolvedScope === 'shared') {
      const packages = await this.harvestService.listSharedDdsPackagesForRecipientTenant(tenantId);
      return { packages };
    }

    if (resolvedScope === 'farmer') {
      const scopedFarmerId = farmerId?.trim();
      if (!scopedFarmerId) {
        throw new ForbiddenException('farmerId is required when scope=farmer');
      }
      if (!['exporter', 'cooperative', 'admin', 'compliance_manager'].includes(role)) {
        throw new ForbiddenException('Only organisation operators can list DDS packages');
      }
      if (role !== 'admin') {
        const inTenant = await this.harvestService.isFarmerInTenant(scopedFarmerId, tenantId);
        if (!inTenant) {
          throw new ForbiddenException('Farmer scope violation');
        }
      }
      const packages = await this.harvestService.listDdsPackagesForFarmer(scopedFarmerId);
      return { packages };
    }

    if (!['exporter', 'cooperative', 'admin', 'compliance_manager'].includes(role)) {
      throw new ForbiddenException('Only organisation operators can list DDS packages');
    }
    const packages = await this.harvestService.listDdsPackagesForTenant(tenantId);
    return { packages };
  }

  @Get('packages/:id')
  async getPackage(@Param('id') id: string, @Req() req: any) {
    this.requireTenantClaim(req);
    await this.enforcePackageReadAccess(id, req);
    return this.harvestService.getDdsPackageDetail(id);
  }

  @Get('packages/:id/evidence-documents')
  @ApiOperation({
    summary: 'List package evidence documents',
    description:
      'Returns typed evidence-document records for a DDS package to support compliance evidence diagnostics surfaces.',
  })
  @ApiOkResponse({
    description: 'Typed evidence-document diagnostics rows for the selected DDS package.',
    type: DdsPackageEvidenceDocumentDto,
    isArray: true,
  })
  async getPackageEvidenceDocuments(@Param('id') id: string, @Req() req: any) {
    this.requireTenantClaim(req);
    await this.enforcePackageReadAccess(id, req);
    return this.harvestService.listDdsPackageEvidenceDocuments(id);
  }

  @Get('packages/:id/readiness')
  @ApiOperation({
    summary: 'Evaluate DDS package readiness rules',
    description:
      'Runs deterministic blocker/warning checks for package submission readiness and returns tenant-scoped readiness status.',
  })
  async getPackageReadiness(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    this.requireTenantClaim(req);
    await this.enforcePackageReadAccess(id, req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    return this.harvestService.evaluateDdsPackageReadiness(id);
  }

  @Get('packages/:id/risk-score')
  @ApiOperation({
    summary: 'Evaluate DDS package risk score',
    description:
      'Runs deterministic single-provider risk scoring with explainability reasons for the selected DDS package.',
  })
  async getPackageRiskScore(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can evaluate DDS package risk score');
    }
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    return this.harvestService.evaluateDdsPackageRiskScore(id, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      exportedBy:
        (req?.user?.email as string | undefined) ??
        ((req?.user?.id as string | undefined) ? `user:${String(req.user.id)}` : null),
    });
  }

  @Get('packages/:id/filing-preflight')
  @ApiOperation({
    summary: 'Evaluate filing pre-flight readiness',
    description:
      'Combines readiness and risk checks into a deterministic pre-flight result used before filing submission lifecycle actions.',
  })
  async getPackageFilingPreflight(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can evaluate filing pre-flight');
    }
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    return this.harvestService.evaluateDdsPackageFilingPreflight(id, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      exportedBy:
        (req?.user?.email as string | undefined) ??
        ((req?.user?.id as string | undefined) ? `user:${String(req.user.id)}` : null),
    });
  }

  @Get('packages/:id/traces-json')
  @ApiOperation({
    summary: 'Export DDS package as TRACES-style JSON',
    description:
      'Returns a compact JSON object with lots, kg, plot areas and a TRACES-like reference field suitable for uploading or mapping into TRACES NT.',
  })
  async getPackageTracesJson(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can export TRACES JSON');
    }
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    return this.harvestService.getDdsPackageTracesJson(id);
  }

  @Post('packages/:id/generate')
  @ApiOperation({
    summary: 'Generate filing package artifacts',
    description:
      'Runs pre-flight checks and creates deterministic filing artifact metadata prior to submission.',
  })
  async generatePackage(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can generate DDS package filing artifacts');
    }
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    return this.harvestService.generateDdsPackageArtifacts(id, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      exportedBy:
        (req?.user?.email as string | undefined) ??
        ((req?.user?.id as string | undefined) ? `user:${String(req.user.id)}` : null),
    });
  }

  @Patch('packages/:id/submit')
  async submitPackage(@Param('id') id: string, @Body() dto: SubmitDdsPackageDto, @Req() req: any) {
    const tenantId = this.getTenantId(req);
    const role = resolveDashboardRole(req.user);
    const destinationRoles = new Set(['importer', 'compliance_manager']);
    const originRoles = new Set(['exporter', 'cooperative', 'admin']);
    if (!destinationRoles.has(role) && !originRoles.has(role)) {
      throw new ForbiddenException('Insufficient permissions to submit DDS packages');
    }
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_compliance');
    return this.harvestService.submitDdsPackage(
      id,
      dto.idempotencyKey,
      {
        tenantId,
        userId: (req?.user?.id as string | undefined) ?? null,
        exportedBy:
          (req?.user?.email as string | undefined) ??
          ((req?.user?.id as string | undefined) ? `user:${String(req.user.id)}` : null),
      },
      { meterDestinationSubmit: destinationRoles.has(role) },
    );
  }
}

