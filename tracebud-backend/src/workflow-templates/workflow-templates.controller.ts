import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';

type WorkflowStageStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';

type CreateWorkflowTemplateBody = {
  name?: string;
  stages?: string[];
  slaHours?: number;
};

type TransitionStageBody = {
  toStatus?: WorkflowStageStatus;
  reason?: string;
};

type TransitionSlaStateBody = {
  toState?: 'on_track' | 'warning' | 'breached' | 'escalated';
  reason?: string;
};

const ALLOWED_TRANSITIONS: Record<WorkflowStageStatus, WorkflowStageStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['completed'],
  completed: ['approved', 'rejected'],
  approved: [],
  rejected: ['in_progress'],
};

type WorkflowSlaState = 'on_track' | 'warning' | 'breached' | 'escalated';

const ALLOWED_SLA_TRANSITIONS: Record<WorkflowSlaState, WorkflowSlaState[]> = {
  on_track: ['warning'],
  warning: ['breached', 'on_track'],
  breached: ['escalated', 'on_track'],
  escalated: ['on_track'],
};

@ApiTags('WorkflowTemplates')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/workflow-templates')
export class WorkflowTemplatesController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private normalizeAuditUserId(userIdRaw: unknown): string | null {
    if (typeof userIdRaw !== 'string') {
      return null;
    }
    const normalized = userIdRaw.trim();
    if (!normalized) {
      return null;
    }
    return this.uuidPattern.test(normalized) ? normalized : null;
  }

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) throw new ForbiddenException('Missing tenant claim');
    return tenantId;
  }

  private requireExporter(req: any) {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter') throw new ForbiddenException('Only exporters can manage workflow templates');
  }

  @Post()
  @ApiOperation({
    summary: 'Create workflow template',
    description: 'Creates tenant-scoped workflow template baseline and records immutable audit evidence.',
  })
  async createTemplate(@Body() body: CreateWorkflowTemplateBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    this.requireExporter(req);
    const name = body?.name?.trim() ?? '';
    const stages = Array.isArray(body?.stages)
      ? body.stages.map((s) => String(s).trim()).filter((s) => s.length > 0)
      : [];
    const slaHours = Number(body?.slaHours ?? 24);
    if (!name || stages.length === 0 || !Number.isFinite(slaHours) || slaHours < 1 || slaHours > 24 * 30) {
      throw new BadRequestException('name, stages, and slaHours(1-720) are required.');
    }

    const templateId = randomUUID();
    const actorUserId = this.normalizeAuditUserId(req?.user?.id);
    const capturedAt = new Date().toISOString();
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          actorUserId,
          'dashboard-web',
          'workflow_template_created',
          JSON.stringify({
            tenantId,
            templateId,
            name,
            stages,
            slaHours,
            actorUserId,
            actorRole: 'exporter',
            capturedAt,
            status: 'active',
          }),
        ],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') throw error;
    }
    return { id: templateId, status: 'active' };
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiOperation({ summary: 'List workflow templates for tenant' })
  async listTemplates(
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent') {
      throw new ForbiddenException('Only exporters or agents can view workflow templates');
    }
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) throw new BadRequestException('limit must be between 1 and 200.');
    if (!Number.isFinite(offset) || offset < 0) throw new BadRequestException('offset must be >= 0.');

    try {
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type = 'workflow_template_created'
            AND payload ->> 'tenantId' = $1
        `,
        [tenantId],
      );
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, event_type, payload
          FROM audit_log
          WHERE event_type = 'workflow_template_created'
            AND payload ->> 'tenantId' = $1
          ORDER BY timestamp DESC
          LIMIT $2
          OFFSET $3
        `,
        [tenantId, limit, offset],
      );
      return { items: listRes.rows, total: Number(countRes.rows[0]?.total ?? 0), limit, offset };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') return { items: [], total: 0, limit, offset };
      throw error;
    }
  }

  @Post(':id/stages/:stageId/transitions')
  @ApiOperation({ summary: 'Transition workflow stage state' })
  async transitionStage(
    @Param('id') templateId: string,
    @Param('stageId') stageId: string,
    @Body() body: TransitionStageBody,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    const toStatus = body?.toStatus;
    if (!toStatus || !['pending', 'in_progress', 'completed', 'approved', 'rejected'].includes(toStatus)) {
      throw new BadRequestException('toStatus must be one of pending|in_progress|completed|approved|rejected.');
    }
    if ((toStatus === 'approved' || toStatus === 'rejected') && role !== 'exporter') {
      throw new ForbiddenException('Only exporters can approve or reject workflow stages');
    }
    if ((toStatus === 'in_progress' || toStatus === 'completed') && role === 'farmer') {
      throw new ForbiddenException('Only exporters or agents can execute workflow stage transitions');
    }

    let fromStatus: WorkflowStageStatus = 'pending';
    try {
      const currentRes = await this.pool.query<{ payload: { toStatus?: WorkflowStageStatus } }>(
        `
          SELECT payload
          FROM audit_log
          WHERE event_type = 'workflow_stage_transitioned'
            AND payload ->> 'tenantId' = $1
            AND payload ->> 'templateId' = $2
            AND payload ->> 'stageId' = $3
          ORDER BY timestamp DESC
          LIMIT 1
        `,
        [tenantId, templateId, stageId],
      );
      fromStatus = (currentRes.rows[0]?.payload?.toStatus ?? 'pending') as WorkflowStageStatus;
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') throw error;
    }

    if (!ALLOWED_TRANSITIONS[fromStatus].includes(toStatus)) {
      throw new BadRequestException(`Invalid stage transition: ${fromStatus} -> ${toStatus}`);
    }

    const transitionId = randomUUID();
    const actorUserId = this.normalizeAuditUserId(req?.user?.id);
    const capturedAt = new Date().toISOString();
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          actorUserId,
          'dashboard-web',
          'workflow_stage_transitioned',
          JSON.stringify({
            tenantId,
            templateId,
            stageId,
            transitionId,
            fromStatus,
            toStatus,
            actorRole: role,
            actorUserId,
            reason: body?.reason?.trim() || null,
            capturedAt,
          }),
        ],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') throw error;
    }

    return { transitionId, templateId, stageId, fromStatus, toStatus };
  }

  @Post(':id/stages/:stageId/sla-transitions')
  @ApiOperation({ summary: 'Transition workflow stage SLA state' })
  async transitionStageSla(
    @Param('id') templateId: string,
    @Param('stageId') stageId: string,
    @Body() body: TransitionSlaStateBody,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    const toState = body?.toState;
    if (!toState || !['on_track', 'warning', 'breached', 'escalated'].includes(toState)) {
      throw new BadRequestException('toState must be one of on_track|warning|breached|escalated.');
    }
    if ((toState === 'warning' || toState === 'breached') && role === 'farmer') {
      throw new ForbiddenException('Only exporters or agents can record SLA warning or breach.');
    }
    if (toState === 'escalated' && role !== 'exporter') {
      throw new ForbiddenException('Only exporters can escalate SLA breaches');
    }
    if (toState === 'on_track' && role === 'farmer') {
      throw new ForbiddenException('Only exporters or agents can recover SLA state');
    }

    let fromState: WorkflowSlaState = 'on_track';
    try {
      const currentRes = await this.pool.query<{ payload: { toState?: WorkflowSlaState; slaState?: WorkflowSlaState } }>(
        `
          SELECT payload
          FROM audit_log
          WHERE event_type IN (
            'workflow_stage_sla_warning',
            'workflow_stage_sla_breached',
            'workflow_stage_sla_escalated',
            'workflow_stage_sla_recovered'
          )
            AND payload ->> 'tenantId' = $1
            AND payload ->> 'templateId' = $2
            AND payload ->> 'stageId' = $3
          ORDER BY timestamp DESC
          LIMIT 1
        `,
        [tenantId, templateId, stageId],
      );
      fromState = (currentRes.rows[0]?.payload?.toState ??
        currentRes.rows[0]?.payload?.slaState ??
        'on_track') as WorkflowSlaState;
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') throw error;
    }

    if (!ALLOWED_SLA_TRANSITIONS[fromState].includes(toState)) {
      throw new BadRequestException(`Invalid SLA transition: ${fromState} -> ${toState}`);
    }

    const transitionId = randomUUID();
    const actorUserId = this.normalizeAuditUserId(req?.user?.id);
    const capturedAt = new Date().toISOString();
    const eventType =
      toState === 'warning'
        ? 'workflow_stage_sla_warning'
        : toState === 'breached'
          ? 'workflow_stage_sla_breached'
          : toState === 'escalated'
            ? 'workflow_stage_sla_escalated'
            : 'workflow_stage_sla_recovered';
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          actorUserId,
          'dashboard-web',
          eventType,
          JSON.stringify({
            tenantId,
            templateId,
            stageId,
            transitionId,
            fromState,
            toState,
            slaState: toState,
            actorRole: role,
            actorUserId,
            reason: body?.reason?.trim() || null,
            capturedAt,
          }),
        ],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') throw error;
    }

    return { transitionId, templateId, stageId, fromState, toState };
  }
}

