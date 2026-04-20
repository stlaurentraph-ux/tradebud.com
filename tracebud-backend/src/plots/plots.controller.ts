import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreatePlotDto } from './dto/create-plot.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { UpdatePlotGeometryDto } from './dto/update-plot-geometry.dto';
import { CreatePlotAssignmentDto } from './dto/create-plot-assignment.dto';
import { UpdatePlotAssignmentStatusDto } from './dto/update-plot-assignment-status.dto';
import { PlotGeometryHistoryEventDto } from './dto/plot-geometry-history-response.dto';
import { PlotsService } from './plots.service';

@ApiTags('Plots')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  private requireTenantClaim(req: any) {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
  }

  private async enforceSyncPlotScope(plotId: string, req: any, assignmentId?: string) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can sync plot metadata');
    }
    const userId = req.user?.id as string | undefined;
    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(plotId, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    } else {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const assigned = await this.plotsService.isAgentAssignedToPlot(plotId, userId, assignmentId);
      if (!assigned) {
        throw new ForbiddenException('Assignment scope violation');
      }
    }
    return userId;
  }

  private enforceAssignmentManagementRole(req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only agents or exporters can manage plot assignments');
    }
  }

  @Post()
  async create(@Body() dto: CreatePlotDto, @Req() req: any) {
    this.requireTenantClaim(req);
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
  async listByFarmer(@Query('farmerId') farmerId: string, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isFarmerOwnedByUser(farmerId, userId);
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    }
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
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can edit plots');
    }
    const userId = req.user?.id as string | undefined;
    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    }
    return this.plotsService.updateMetadata(id, dto, userId);
  }

  @Patch(':id/geometry')
  @ApiOperation({
    summary: 'Revise plot geometry with immutable supersession audit',
    description:
      'Updates plot geometry under v1.6 validation guards (ST_MakeValid + area variance tolerance) and records immutable supersession audit metadata.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async updateGeometry(@Param('id') id: string, @Body() dto: UpdatePlotGeometryDto, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent') {
      throw new ForbiddenException('Only farmers or agents can revise plot geometry');
    }
    const userId = req.user?.id as string | undefined;
    if (role === 'farmer') {
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    }
    return this.plotsService.updateGeometry(id, dto, userId);
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
    this.requireTenantClaim(req);
    const userId = await this.enforceSyncPlotScope(id, req, dto.assignmentId);
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
    this.requireTenantClaim(req);
    const userId = await this.enforceSyncPlotScope(id, req, dto.assignmentId);
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
    this.requireTenantClaim(req);
    const userId = await this.enforceSyncPlotScope(id, req, dto.assignmentId);
    return this.plotsService.syncEvidence(id, dto, userId);
  }

  @Post(':id/assignments')
  @ApiOperation({
    summary: 'Create active plot assignment for an agent',
    description: 'Creates an active assignment row used by mobile sync scope checks.',
  })
  async createAssignment(@Param('id') id: string, @Body() dto: CreatePlotAssignmentDto, @Req() req: any) {
    this.requireTenantClaim(req);
    this.enforceAssignmentManagementRole(req);
    return this.plotsService.createAssignment(id, dto.assignmentId, dto.agentUserId);
  }

  @Get(':id/assignments')
  @ApiOperation({
    summary: 'List plot assignment history',
    description: 'Returns assignment rows for this plot ordered by most recent assignment timestamp.',
  })
  async listAssignments(
    @Param('id') id: string,
    @Query('status') statusRaw: string | undefined,
    @Query('fromDays') fromDaysRaw: string | undefined,
    @Query('agentUserId') agentUserIdRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('format') formatRaw: string | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) response?: any,
  ) {
    this.requireTenantClaim(req);
    this.enforceAssignmentManagementRole(req);
    const status: 'all' | 'active' | 'completed' | 'cancelled' =
      statusRaw === 'active' || statusRaw === 'completed' || statusRaw === 'cancelled' ? statusRaw : 'all';
    const fromDays = fromDaysRaw ? Number(fromDaysRaw) : 30;
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id ??
      null;
    const userId = (req?.user?.id as string | undefined) ?? null;
    const exportedBy =
      (req?.user?.email as string | undefined) ??
      (userId ? `user:${String(userId)}` : null);
    if (formatRaw === 'csv') {
      await this.plotsService.appendAssignmentExportAuditEvent({
        phase: 'requested',
        plotId: id,
        userId,
        tenantId,
        exportedBy,
        filters: { status, fromDays, agentUserId: agentUserIdRaw?.trim() ? agentUserIdRaw.trim() : null },
      }).catch(() => undefined);
      const exportLimit = 100;
      let exportOffset = 0;
      let exportTotal = 0;
      const exportRows: Awaited<ReturnType<PlotsService['listAssignmentsByPlot']>>['items'] = [];
      try {
        do {
          const exportPage = await this.plotsService.listAssignmentsByPlot(id, {
            status,
            fromDays,
            agentUserId: agentUserIdRaw,
            limit: exportLimit,
            offset: exportOffset,
          });
          const pageItems = Array.isArray(exportPage.items) ? exportPage.items : [];
          exportTotal = exportPage.total;
          exportRows.push(...pageItems);
          exportOffset += exportLimit;
          if (pageItems.length === 0) break;
        } while (exportRows.length < exportTotal);
      } catch (error) {
        await this.plotsService.appendAssignmentExportAuditEvent({
          phase: 'failed',
          plotId: id,
          userId,
          tenantId,
          exportedBy,
          filters: { status, fromDays, agentUserId: agentUserIdRaw?.trim() ? agentUserIdRaw.trim() : null },
          error: error instanceof Error ? error.message : 'assignment_export_failed',
        }).catch(() => undefined);
        throw error;
      }
      const escapeCsv = (value: string | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const lines = [
        'assignment_id,plot_id,agent_user_id,agent_name,agent_email,status,assigned_at,ended_at',
        ...exportRows.map((item) =>
          [
            escapeCsv(item.assignmentId),
            escapeCsv(item.plotId),
            escapeCsv(item.agentUserId),
            escapeCsv(item.agentName ?? ''),
            escapeCsv(item.agentEmail ?? ''),
            escapeCsv(item.status),
            escapeCsv(item.assignedAt),
            escapeCsv(item.endedAt ?? ''),
          ].join(','),
        ),
      ];
      await this.plotsService.appendAssignmentExportAuditEvent({
        phase: 'succeeded',
        plotId: id,
        userId,
        tenantId,
        exportedBy,
        rowCount: exportRows.length,
        filters: { status, fromDays, agentUserId: agentUserIdRaw?.trim() ? agentUserIdRaw.trim() : null },
      }).catch(() => undefined);
      if (response?.setHeader) {
        response.setHeader('Content-Type', 'text/csv; charset=utf-8');
        response.setHeader('Content-Disposition', `attachment; filename="plot-${id}-assignments.csv"`);
        response.setHeader('X-Export-Row-Count', String(exportRows.length));
      }
      return lines.join('\n');
    }
    return this.plotsService.listAssignmentsByPlot(id, {
      status,
      fromDays,
      agentUserId: agentUserIdRaw,
      limit,
      offset,
    });
  }

  @Patch('assignments/:assignmentId/complete')
  @ApiOperation({
    summary: 'Complete active plot assignment',
    description: 'Transitions assignment state from active to completed.',
  })
  async completeAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() _dto: UpdatePlotAssignmentStatusDto,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    this.enforceAssignmentManagementRole(req);
    return this.plotsService.completeAssignment(assignmentId);
  }

  @Patch('assignments/:assignmentId/cancel')
  @ApiOperation({
    summary: 'Cancel active plot assignment',
    description: 'Transitions assignment state from active to cancelled.',
  })
  async cancelAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() _dto: UpdatePlotAssignmentStatusDto,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    this.enforceAssignmentManagementRole(req);
    return this.plotsService.cancelAssignment(assignmentId);
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

  @Post(':id/deforestation-decision')
  @ApiOperation({
    summary: 'Run historical deforestation decision check for a plot',
    description:
      'Evaluates alert-based deforestation signals against the plot geometry using a provided cutoff date and records immutable decision evidence in the audit log.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  @ApiQuery({ name: 'cutoffDate', required: true, description: 'Historical decision cutoff date (YYYY-MM-DD).' })
  async runDeforestationDecision(
    @Param('id') id: string,
    @Query('cutoffDate') cutoffDate: string,
    @Req() req: any,
  ) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only agents or exporters can run deforestation decisions');
    }
    const userId = req.user?.id as string | undefined;
    return this.plotsService.runDeforestationDecision(id, userId, cutoffDate);
  }

  @Get(':id/compliance-history')
  @ApiOperation({
    summary: 'Get compliance history for a plot (audit trail)',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async complianceHistory(@Param('id') id: string) {
    return this.plotsService.getComplianceHistory(id);
  }

  @Get(':id/deforestation-decision-history')
  @ApiOperation({
    summary: 'Get historical deforestation decision history for a plot (audit trail)',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async deforestationDecisionHistory(@Param('id') id: string) {
    return this.plotsService.getDeforestationDecisionHistory(id);
  }

  @Get(':id/geometry-history')
  @ApiOperation({
    summary: 'Get geometry revision history for a plot (immutable audit trail)',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size (default 100, max 200).' })
  @ApiQuery({ name: 'offset', required: false, description: 'Page offset (default 0).' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort direction (desc|asc).' })
  @ApiQuery({ name: 'anomalyProfile', required: false, description: 'Anomaly sensitivity profile (strict|balanced|lenient).' })
  @ApiQuery({ name: 'signalsOnly', required: false, description: 'When true, only return events with active anomaly flags.' })
  @ApiOkResponse({
    description: 'Immutable geometry revision events for this plot.',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/PlotGeometryHistoryEventDto' },
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              type: { type: 'string', enum: ['large_revision_jump', 'frequent_supersession'] },
              severity: { type: 'string', enum: ['medium', 'high'] },
              message: { type: 'string' },
            },
            required: ['eventId', 'type', 'severity', 'message'],
          },
        },
        total: { type: 'integer' },
        limit: { type: 'integer' },
        offset: { type: 'integer' },
        sort: { type: 'string', enum: ['desc', 'asc'] },
        anomalyProfile: { type: 'string', enum: ['strict', 'balanced', 'lenient'] },
        signalsOnly: { type: 'boolean' },
        anomalySummaryScope: { type: 'string', enum: ['current_page', 'full_filtered_set'] },
        anomalySummary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            highSeverity: { type: 'integer' },
            mediumSeverity: { type: 'integer' },
            byType: {
              type: 'object',
              properties: {
                largeRevisionJump: { type: 'integer' },
                frequentSupersession: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  })
  async geometryHistory(
    @Param('id') id: string,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: string | undefined,
    @Query('anomalyProfile') anomalyProfileRaw: string | undefined,
    @Query('signalsOnly') signalsOnlyRaw: string | undefined,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    }
    const limit = limitRaw ? Number(limitRaw) : 100;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    const sort: 'desc' | 'asc' = sortRaw === 'asc' ? 'asc' : 'desc';
    const anomalyProfile: 'strict' | 'balanced' | 'lenient' =
      anomalyProfileRaw === 'strict' || anomalyProfileRaw === 'lenient' ? anomalyProfileRaw : 'balanced';
    const signalsOnly = signalsOnlyRaw === 'true';
    return this.plotsService.getGeometryHistory(id, limit, offset, sort, anomalyProfile, signalsOnly);
  }
}

