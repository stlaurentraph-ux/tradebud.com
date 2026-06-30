import { Body, Controller, ForbiddenException, Get, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { resolveFieldActorRole, assertTenantClaimOrFieldActor } from '../auth/field-app-auth';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';
import { CreatePlotDto } from './dto/create-plot.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { UpdatePlotGeometryDto } from './dto/update-plot-geometry.dto';
import { CreatePlotAssignmentDto } from './dto/create-plot-assignment.dto';
import { UpdatePlotAssignmentStatusDto } from './dto/update-plot-assignment-status.dto';
import { PlotGeometryHistoryEventDto } from './dto/plot-geometry-history-response.dto';
import { PlotReviewDecisionDto } from './dto/plot-review-decision.dto';
import { TenureReviewConfirmDto } from './dto/tenure-review-confirm.dto';
import { ConsentService } from '../consent/consent.service';
import { PlotsService } from './plots.service';

@ApiTags('Plots')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/plots')
export class PlotsController {
  constructor(
    private readonly plotsService: PlotsService,
    private readonly consentService: ConsentService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  private requireTenantClaim(req: any) {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
  }

  private async requireTenantClaimOrFieldActor(req: any) {
    await assertTenantClaimOrFieldActor(this.pool, req.user);
  }

  private async enforceSyncPlotScope(plotId: string, req: any, assignmentId?: string) {
    const role = await resolveFieldActorRole(this.pool, req.user);
    if (!role) {
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

  private enforcePlotReviewRole(req: any) {
    const role = deriveRoleFromSupabaseUser(req.user);
    if (
      role !== 'exporter' &&
      role !== 'compliance_manager' &&
      role !== 'country_reviewer' &&
      role !== 'admin'
    ) {
      throw new ForbiddenException('Not allowed to adjudicate plot reviews');
    }
  }

  private async enforcePlotTenantAccess(plotId: string, req: any): Promise<string> {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    const allowed = await this.consentService.canTenantAccessPlot(plotId, tenantId);
    if (!allowed) {
      throw new ForbiddenException('CONSENT_REQUIRED');
    }
    return tenantId;
  }

  @Get('tenure-review-queue')
  @ApiOperation({
    summary: 'List tenure documents awaiting human review for the active tenant',
    description:
      'Returns tenure_evidence parse rows in MANUAL_REQUIRED or FAILED with linked compliance issues.',
  })
  async listTenureReviewQueue(@Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer' || role === 'agent') {
      throw new ForbiddenException('Not allowed');
    }
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return this.plotsService.listTenureReviewQueue(tenantId, (plotId) =>
      this.consentService.canTenantAccessPlot(plotId, tenantId),
    );
  }

  @Get('geometry-remediation-queue')
  @ApiOperation({
    summary: 'List recent polygon geometry rejections for cooperative field follow-up',
    description:
      'Returns audit events where mobile or API upload failed geometry quality checks (self-intersection, overlap, sliver).',
  })
  async listGeometryRemediationQueue(@Req() req: any, @Query('limit') limitRaw?: string) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer' || role === 'agent') {
      throw new ForbiddenException('Not allowed');
    }
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    const limit = limitRaw ? Number(limitRaw) : 50;
    return this.plotsService.listGeometryRemediationQueue(tenantId, limit);
  }

  @Get('review-queue')
  @ApiOperation({
    summary: 'List plots awaiting compliance review for the active tenant',
    description:
      'Returns plots in under_review, degradation_risk, or deforestation_detected with ground-truth photo verification summary.',
  })
  async listReviewQueue(@Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role === 'farmer' || role === 'agent') {
      throw new ForbiddenException('Not allowed');
    }
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return this.plotsService.listReviewQueue(tenantId, (plotId) =>
      this.consentService.canTenantAccessPlot(plotId, tenantId),
    );
  }

  @Post(':id/clear-review')
  @ApiOperation({
    summary: 'Manually clear a plot compliance review to compliant',
    description:
      'Human adjudication path for under_review/degradation_risk/deforestation_detected plots. Writes plot_review_cleared audit event.',
  })
  async clearPlotReview(
    @Param('id') id: string,
    @Body() dto: PlotReviewDecisionDto,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    this.enforcePlotReviewRole(req);
    await this.enforcePlotTenantAccess(id, req);
    const userId = req.user?.id as string | undefined;
    return this.plotsService.clearPlotReview(id, dto, userId);
  }

  @Post(':id/uphold-review')
  @ApiOperation({
    summary: 'Uphold or escalate a plot compliance review block',
    description:
      'Keeps or escalates a blocked plot after human review. Writes plot_review_upheld audit event.',
  })
  async upholdPlotReview(
    @Param('id') id: string,
    @Body() dto: PlotReviewDecisionDto,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    this.enforcePlotReviewRole(req);
    await this.enforcePlotTenantAccess(id, req);
    const userId = req.user?.id as string | undefined;
    return this.plotsService.upholdPlotReview(id, dto, userId);
  }

  @Post()
  async create(@Body() dto: CreatePlotDto, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const userId = req.user?.id as string | undefined;
    const actorRole = await resolveFieldActorRole(this.pool, req.user);
    const jwtRole = deriveRoleFromSupabaseUser(req.user);
    if (actorRole !== 'farmer' && actorRole !== 'agent' && jwtRole !== 'exporter') {
      throw new ForbiddenException('Only farmers, agents, or exporters can create plots');
    }
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    const email = typeof req.user?.email === 'string' ? req.user.email : undefined;
    const fullName =
      typeof req.user?.user_metadata?.full_name === 'string'
        ? req.user.user_metadata.full_name
        : typeof req.user?.user_metadata?.fullName === 'string'
          ? req.user.user_metadata.fullName
          : undefined;
    const row = await this.plotsService.create(dto, userId, tenantId, { email, fullName });
    return row;
  }

  @Get()
  @ApiQuery({ name: 'farmerId', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['tenant', 'farmer'] })
  async listByFarmer(
    @Query('farmerId') farmerId: string | undefined,
    @Query('scope') scope: string | undefined,
    @Req() req: any,
  ) {
    await this.requireTenantClaimOrFieldActor(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    const actorRole = await resolveFieldActorRole(this.pool, req.user);
    const resolvedScope = scope === 'tenant' || !farmerId?.trim() ? 'tenant' : 'farmer';

    if (resolvedScope === 'tenant') {
      if (actorRole === 'farmer') {
        throw new ForbiddenException('Farmers must provide farmerId scope');
      }
      if (!tenantId) {
        throw new ForbiddenException('Missing tenant claim in app_metadata');
      }
      return this.plotsService.listForTenant(tenantId, (plotId) =>
        this.consentService.canTenantAccessPlot(plotId, tenantId),
      );
    }

    const scopedFarmerId = farmerId?.trim();
    if (!scopedFarmerId) {
      throw new ForbiddenException('farmerId is required when scope=farmer');
    }
    if (actorRole === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isFarmerOwnedByUser(scopedFarmerId, userId);
      if (!owned) {
        throw new ForbiddenException('Farmer scope violation');
      }
    } else {
      const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
      if (!tenantId) {
        throw new ForbiddenException('Missing tenant claim in app_metadata');
      }
      const plots = await this.plotsService.listByFarmer(scopedFarmerId);
      const allowedPlots = await Promise.all(
        plots.map(async (plot) => ({
          plot,
          allowed: await this.consentService.canTenantAccessPlot(plot.id as string, tenantId),
        })),
      );
      const filtered = allowedPlots.filter((row) => row.allowed).map((row) => row.plot);
      if (filtered.length === 0 && plots.length > 0) {
        throw new ForbiddenException('CONSENT_REQUIRED');
      }
      return filtered;
    }
    return this.plotsService.listByFarmer(scopedFarmerId);
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
    await this.requireTenantClaimOrFieldActor(req);
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
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const userId = req.user?.id as string | undefined;
    const fieldRoles = role === 'farmer' || role === 'agent';
    const reviewerRoles =
      role === 'exporter' ||
      role === 'cooperative' ||
      role === 'admin' ||
      role === 'country_reviewer';

    if (!fieldRoles && !reviewerRoles) {
      throw new ForbiddenException('Not allowed to revise plot geometry');
    }

    if (fieldRoles) {
      if (role === 'farmer') {
        if (!userId) {
          throw new ForbiddenException('Missing authenticated user');
        }
        const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
        if (!owned) {
          throw new ForbiddenException('Plot scope violation');
        }
      }
    } else {
      await this.enforcePlotTenantAccess(id, req);
    }

    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    return this.plotsService.updateGeometry(id, dto, userId, tenantId);
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
    await this.requireTenantClaimOrFieldActor(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    const userId = await this.enforceSyncPlotScope(id, req, dto.assignmentId);
    return this.plotsService.syncPhotos(id, dto, userId, tenantId);
  }

  @Post(':id/legal-sync')
  @ApiOperation({
    summary: 'Sync legality metadata (cadastral key / tenure) with immutable audit trail',
    description:
      'Stores legality metadata and a human-readable reason in the server audit log. This does not currently mutate plot rows; it records evidence for later legality checks.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async syncLegal(@Param('id') id: string, @Body() dto: SyncPlotLegalDto, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
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
    await this.requireTenantClaimOrFieldActor(req);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    const userId = await this.enforceSyncPlotScope(id, req, dto.assignmentId);
    return this.plotsService.syncEvidence(id, dto, userId, tenantId);
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
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
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
      'Runs a post-cutoff GFW alert query for the plot geometry, updates plot.status from the screening result (merged with overlap flags), and writes an immutable gfw_check_run audit event.',
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
  async complianceHistory(@Param('id') id: string, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    } else if (tenantId) {
      await this.enforcePlotTenantAccess(id, req);
    }
    return this.plotsService.getComplianceHistory(id);
  }

  @Post(':id/tenure-verification/:verificationId/confirm-review')
  @ApiOperation({
    summary: 'Confirm human review for a tenure document parse result',
    description:
      'Exporter/compliance reviewer accepts a MANUAL_REQUIRED or FAILED tenure parse after document review.',
  })
  async confirmTenureReview(
    @Param('id') plotId: string,
    @Param('verificationId') verificationId: string,
    @Body() dto: TenureReviewConfirmDto,
    @Req() req: any,
  ) {
    this.requireTenantClaim(req);
    this.enforcePlotReviewRole(req);
    await this.enforcePlotTenantAccess(plotId, req);
    const userId = req.user?.id as string | undefined;
    return this.plotsService.confirmTenureReview(plotId, verificationId, dto, userId);
  }

  @Get(':id/tenure-verification')
  @ApiOperation({
    summary: 'List AI tenure parse results for plot evidence files',
    description:
      'Returns async parse status and structured extraction for tenure_evidence uploads (producer-in-possession path).',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async tenureVerification(@Param('id') id: string, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    } else if (tenantId) {
      await this.enforcePlotTenantAccess(id, req);
    }
    return this.plotsService.listTenureVerification(id);
  }

  @Get(':id/synced-evidence')
  @ApiOperation({
    summary: 'List synced evidence files for a plot (mobile cross-device restore)',
    description:
      'Returns storage keys and metadata for documents uploaded from the field app.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async syncedEvidence(@Param('id') id: string, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
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
    return this.plotsService.listSyncedEvidence(id);
  }

  @Get(':id/deforestation-decision-history')
  @ApiOperation({
    summary: 'Get historical deforestation decision history for a plot (audit trail)',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async deforestationDecisionHistory(@Param('id') id: string, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    } else if (tenantId) {
      await this.enforcePlotTenantAccess(id, req);
    }
    return this.plotsService.getDeforestationDecisionHistory(id);
  }

  @Get(':id/map-preview')
  @ApiOperation({
    summary: 'Read-only plot map preview (geometry + metadata)',
    description:
      'Returns current plot geometry for dashboard map rendering. Point plots are not buffered.',
  })
  @ApiParam({ name: 'id', description: 'Plot ID' })
  async mapPreview(@Param('id') id: string, @Req() req: any) {
    await this.requireTenantClaimOrFieldActor(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (role === 'farmer') {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        throw new ForbiddenException('Missing authenticated user');
      }
      const owned = await this.plotsService.isPlotOwnedByUser(id, userId);
      if (!owned) {
        throw new ForbiddenException('Plot scope violation');
      }
    } else if (tenantId) {
      await this.enforcePlotTenantAccess(id, req);
    }
    return this.plotsService.getPlotMapPreview(id);
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
    await this.requireTenantClaimOrFieldActor(req);
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

