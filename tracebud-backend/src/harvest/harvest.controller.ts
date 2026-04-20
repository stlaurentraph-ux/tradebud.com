import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { HarvestService } from './harvest.service';
import { CreateDdsPackageDto } from './dto/create-dds-package.dto';
import { SubmitDdsPackageDto } from './dto/submit-dds-package.dto';
import { DdsPackageEvidenceDocumentDto } from './dto/dds-package-evidence-document.dto';

@ApiTags('Harvest')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/harvest')
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  private requireTenantClaim(req: any) {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
  }

  @Post()
  async create(@Body() dto: CreateHarvestDto, @Req() req: any) {
    this.requireTenantClaim(req);
    const userId = req.user?.id as string | undefined;
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can record harvests');
    }
    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.harvestService.isFarmerOwnedByUser(dto.farmerId, userId);
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    }
    return this.harvestService.create(dto, userId);
  }

  @Get('vouchers')
  @ApiQuery({ name: 'farmerId', required: true })
  async listVouchers(@Query('farmerId') farmerId: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.harvestService.isFarmerOwnedByUser(farmerId, userId);
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    }
    return this.harvestService.listVouchersForFarmer(farmerId);
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

  @Post('packages')
  async createPackage(@Body() dto: CreateDdsPackageDto, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can create DDS packages');
    }
    return this.harvestService.createDdsPackage(dto);
  }

  @Get('packages')
  @ApiQuery({ name: 'farmerId', required: true })
  async listPackages(@Query('farmerId') farmerId: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can list DDS packages');
    }
    return this.harvestService.listDdsPackagesForFarmer(farmerId);
  }

  @Get('packages/:id')
  async getPackage(@Param('id') id: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can view DDS package details');
    }
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
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can view package evidence documents');
    }
    return this.harvestService.listDdsPackageEvidenceDocuments(id);
  }

  @Get('packages/:id/readiness')
  @ApiOperation({
    summary: 'Evaluate DDS package readiness rules',
    description:
      'Runs deterministic blocker/warning checks for package submission readiness and returns tenant-scoped readiness status.',
  })
  async getPackageReadiness(@Param('id') id: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can evaluate DDS package readiness');
    }
    return this.harvestService.evaluateDdsPackageReadiness(id);
  }

  @Get('packages/:id/risk-score')
  @ApiOperation({
    summary: 'Evaluate DDS package risk score',
    description:
      'Runs deterministic single-provider risk scoring with explainability reasons for the selected DDS package.',
  })
  async getPackageRiskScore(@Param('id') id: string, @Req() req: any) {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can evaluate DDS package risk score');
    }
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
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can evaluate filing pre-flight');
    }
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
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can export TRACES JSON');
    }
    return this.harvestService.getDdsPackageTracesJson(id);
  }

  @Post('packages/:id/generate')
  @ApiOperation({
    summary: 'Generate filing package artifacts',
    description:
      'Runs pre-flight checks and creates deterministic filing artifact metadata prior to submission.',
  })
  async generatePackage(@Param('id') id: string, @Req() req: any) {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can generate DDS package filing artifacts');
    }
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
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can submit DDS packages');
    }
    return this.harvestService.submitDdsPackage(id, dto.idempotencyKey, {
      tenantId,
      userId: (req?.user?.id as string | undefined) ?? null,
      exportedBy:
        (req?.user?.email as string | undefined) ??
        ((req?.user?.id as string | undefined) ? `user:${String(req.user.id)}` : null),
    });
  }
}

