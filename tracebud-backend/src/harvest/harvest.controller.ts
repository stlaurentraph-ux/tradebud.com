import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { HarvestService } from './harvest.service';
import { CreateDdsPackageDto } from './dto/create-dds-package.dto';

@ApiTags('Harvest')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/harvest')
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  private requireTenantClaim(req: any) {
    const tenantId =
      (typeof req?.user?.app_metadata?.tenant_id === 'string' && req.user.app_metadata.tenant_id) ||
      (typeof req?.user?.user_metadata?.tenant_id === 'string' && req.user.user_metadata.tenant_id) ||
      null;
    if (!tenantId) {
      throw new ForbiddenException('Missing required tenant claim (tenant_id) in signed auth token.');
    }
    return tenantId;
  }

  private async assertFarmerScope(req: any, farmerId: string) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const userId = req.user?.id as string | undefined;
    if (role === 'farmer') {
      const allowed = await this.harvestService.isFarmerOwnedByUser(farmerId, userId);
      if (!allowed) {
        throw new ForbiddenException('Farmers can only access their own records');
      }
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
    await this.assertFarmerScope(req, dto.farmerId);
    return this.harvestService.create(dto, userId);
  }

  @Get('vouchers')
  @ApiQuery({ name: 'farmerId', required: true })
  async listVouchers(@Query('farmerId') farmerId: string, @Req() req: any) {
    await this.assertFarmerScope(req, farmerId);
    return this.harvestService.listVouchersForFarmer(farmerId);
  }

  @Get('vouchers/by-qr')
  @ApiOperation({
    summary: 'Lookup voucher by QR reference',
    description:
      'Used by the offline app to validate a voucher QR code and see whether it is active/used and which DDS package (if any) it belongs to.',
  })
  @ApiQuery({ name: 'qrRef', required: true, description: 'Voucher qr_code_ref (e.g. V-ABC12345)' })
  async getVoucherByQr(@Query('qrRef') qrRef: string, @Req() req: any) {
    this.requireTenantClaim(req);
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
      throw new ForbiddenException('Only exporters can access DDS package details');
    }
    return this.harvestService.getDdsPackageDetail(id);
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
      throw new ForbiddenException('Only exporters can export TRACES payloads');
    }
    return this.harvestService.getDdsPackageTracesJson(id);
  }

  @Patch('packages/:id/submit')
  async submitPackage(@Param('id') id: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can submit DDS packages');
    }
    return this.harvestService.submitDdsPackage(id);
  }
}

