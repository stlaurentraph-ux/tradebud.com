import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreatePlotDto } from './dto/create-plot.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { PlotsService } from './plots.service';

@ApiTags('Plots')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Post()
  async create(@Body() dto: CreatePlotDto, @Req() req: any) {
    const userId = req.user?.id as string | undefined;
    const role = deriveRoleFromSupabaseUser(req.user);
    // Farmers and agents upload from the field app; exporters include @tracebud.com test accounts
    // (see deriveRoleFromSupabaseUser) who still need to create demo plots like agents.
    if (role !== 'farmer' && role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only farmers, agents, or exporters can create plots');
    }
    const row = await this.plotsService.create(dto, userId);
    return row;
  }

  @Get()
  @ApiQuery({ name: 'farmerId', required: true })
  async listByFarmer(@Query('farmerId') farmerId: string) {
    return this.plotsService.listByFarmer(farmerId);
  }

  @Patch(':id/compliance-check')
  @ApiOperation({
    summary: 'Run mock SINAPH/Indigenous compliance check for a plot',
    description:
      'Demo endpoint that marks plots as compliant / degradation_risk / deforestation_detected and toggles SINAPH / Indigenous overlaps without calling real satellite APIs.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async runComplianceCheck(@Param('id') id: string, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only agents or exporters can run compliance checks');
    }
    return this.plotsService.runComplianceCheck(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit plot metadata (e.g. name) with immutable audit trail',
    description:
      'Allows renaming a plot while always writing a plot_edited event into the audit log with a human-readable reason and optional deviceId.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async updateMetadata(@Param('id') id: string, @Body() dto: UpdatePlotDto, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can edit plots');
    }
    const userId = req.user?.id as string | undefined;
    return this.plotsService.updateMetadata(id, dto, userId);
  }

  @Post(':id/photos-sync')
  @ApiOperation({
    summary: 'Sync ground-truth or land title photos metadata for a plot',
    description:
      'Accepts an array of photo metadata from the offline app and stores it in the audit log for later legality / human-rights checks.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async syncPhotos(
    @Param('id') id: string,
    @Body() dto: SyncPlotPhotosDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id as string | undefined;
    return this.plotsService.syncPhotos(id, dto, userId);
  }

  @Post(':id/legal-sync')
  @ApiOperation({
    summary: 'Sync legality metadata (cadastral key / tenure) with immutable audit trail',
    description:
      'Stores legality metadata and a human-readable reason in the server audit log. This does not currently mutate plot rows; it records evidence for later legality checks.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async syncLegal(@Param('id') id: string, @Body() dto: SyncPlotLegalDto, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can sync legality metadata');
    }
    const userId = req.user?.id as string | undefined;
    return this.plotsService.syncLegal(id, dto, userId);
  }

  @Post(':id/evidence-sync')
  @ApiOperation({
    summary: 'Sync evidence repository metadata for a plot',
    description:
      'Stores FPIC docs, permits/management plans, labor evidence, and tenure evidence as immutable audit events.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async syncEvidence(@Param('id') id: string, @Body() dto: SyncPlotEvidenceDto, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can sync evidence metadata');
    }
    const userId = req.user?.id as string | undefined;
    return this.plotsService.syncEvidence(id, dto, userId);
  }

  @Post(':id/gfw-check')
  @ApiOperation({
    summary: 'Run a Global Forest Watch (GFW) check for a plot',
    description:
      'Runs a GFW Data API query for the plot geometry and writes an immutable gfw_check_run event to the audit log.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async runGfwCheck(@Param('id') id: string, @Req() req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'agent' && role !== 'exporter' && role !== 'farmer') {
      throw new ForbiddenException('Not allowed');
    }
    const userId = req.user?.id as string | undefined;
    return this.plotsService.runGfwCheck(id, userId);
  }

  @Get(':id/compliance-history')
  @ApiOperation({
    summary: 'Get compliance history for a plot (audit trail)',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async complianceHistory(@Param('id') id: string) {
    return this.plotsService.getComplianceHistory(id);
  }
}

