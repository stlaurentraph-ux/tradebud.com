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

  @Post()
  async create(@Body() dto: CreateHarvestDto, @Req() req: any) {
    const userId = req.user?.id as string | undefined;
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can record harvests');
    }
    return this.harvestService.create(dto, userId);
  }

  @Get('vouchers')
  @ApiQuery({ name: 'farmerId', required: true })
  async listVouchers(@Query('farmerId') farmerId: string) {
    return this.harvestService.listVouchersForFarmer(farmerId);
  }

  @Post('packages')
  async createPackage(@Body() dto: CreateDdsPackageDto, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can create DDS packages');
    }
    return this.harvestService.createDdsPackage(dto);
  }

  @Get('packages')
  @ApiQuery({ name: 'farmerId', required: true })
  async listPackages(@Query('farmerId') farmerId: string) {
    return this.harvestService.listDdsPackagesForFarmer(farmerId);
  }

  @Get('packages/:id')
  async getPackage(@Param('id') id: string) {
    return this.harvestService.getDdsPackageDetail(id);
  }

  @Get('packages/:id/traces-json')
  @ApiOperation({
    summary: 'Export DDS package as TRACES-style JSON',
    description:
      'Returns a compact JSON object with lots, kg, plot areas and a TRACES-like reference field suitable for uploading or mapping into TRACES NT.',
  })
  async getPackageTracesJson(@Param('id') id: string) {
    return this.harvestService.getDdsPackageTracesJson(id);
  }

  @Patch('packages/:id/submit')
  async submitPackage(@Param('id') id: string, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can submit DDS packages');
    }
    return this.harvestService.submitDdsPackage(id);
  }
}

