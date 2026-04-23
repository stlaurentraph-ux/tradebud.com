import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
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
import type { AppRole } from '../auth/roles';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PG_POOL } from '../db/db.module';
import { LaunchService } from '../launch/launch.service';

type StartPartnerExportBody = {
  scope?: string;
  dataset?: string;
  format?: 'csv' | 'parquet' | string;
  idempotencyKey?: string;
  cursor?: string;
};

type FinalizePartnerExportBody = {
  outcome?: 'completed' | 'failed' | string;
  artifactUrl?: string;
  errorCode?: string;
};

type RetrySweepBody = {
  limit?: number;
};

type PartnerExportRow = {
  id: string;
  tenant_id: string;
  scope: string;
  dataset: string;
  format: 'csv' | 'parquet';
  idempotency_key: string;
  cursor: string | null;
  status: 'queued' | 'completed' | 'failed';
  state: 'partner_sync_pending' | 'partner_sync_succeeded' | 'partner_sync_terminal_failed';
  artifact_url: string | null;
  attempt_count: number;
  error_code: string | null;
  next_retry_at: string | null;
  retry_exhausted_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

const ALLOWED_PARTNER_SCOPES = ['read:lineage', 'read:compliance', 'read:risk', 'read:shipments'] as const;
type AllowedPartnerScope = (typeof ALLOWED_PARTNER_SCOPES)[number];
const MAX_PARTNER_EXPORT_RETRY_ATTEMPTS = 5;
const PARTNER_RETRY_SWEEP_DEFAULT_LIMIT = 50;
const PARTNER_RETRY_SWEEP_MAX_LIMIT = 200;

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/partner-data')
export class PartnerDataController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly launchService: LaunchService,
  ) {}

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private getSchedulerTokenHeader(tokenRaw: string | undefined) {
    const provided = tokenRaw?.trim();
    const expected = process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN?.trim();
    if (!expected) {
      throw new BadRequestException('PARTNER_EXPORT_RETRY_SWEEP_TOKEN is not configured');
    }
    if (!provided || provided !== expected) {
      throw new ForbiddenException('Invalid scheduler token');
    }
  }

  private requireRole(req: any, allowed: AppRole[], errorMessage: string): AppRole {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!allowed.includes(role)) {
      throw new ForbiddenException(errorMessage);
    }
    return role;
  }

  private parseScope(scopeRaw: string | undefined): AllowedPartnerScope {
    const scope = (scopeRaw ?? '').trim() as AllowedPartnerScope;
    if (!scope || !ALLOWED_PARTNER_SCOPES.includes(scope)) {
      throw new BadRequestException(`scope must be one of: ${ALLOWED_PARTNER_SCOPES.join(', ')}`);
    }
    return scope;
  }

  private async appendAuditEvent(
    actorUserId: string | null,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [actorUserId, 'dashboard-web', eventType, JSON.stringify(payload)],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') {
        throw error;
      }
    }
  }

  private mapExportRowToResponse(row: PartnerExportRow, replayed: boolean) {
    return {
      exportId: row.id,
      status: row.status,
      state: row.state,
      dataset: row.dataset,
      format: row.format,
      idempotencyKey: row.idempotency_key,
      cursor: row.cursor,
      replayed,
      attemptCount: Number(row.attempt_count ?? 1),
      errorCode: row.error_code,
      nextRetryAt: row.next_retry_at,
      retryExhaustedAt: row.retry_exhausted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private computeBackoffMinutes(attemptCount: number): number {
    return Math.min(60, 2 ** Math.max(0, attemptCount - 1));
  }

  private handleMissingPartnerExportTable(error: unknown): never {
    const err = error as { code?: string };
    if (err?.code === '42P01') {
      throw new BadRequestException(
        'Partner export tables are not available. Apply migration TB-V16-018 before using partner export endpoints.',
      );
    }
    throw error;
  }

  @Get('datasets')
  @ApiQuery({
    name: 'scope',
    required: true,
    type: String,
    description: 'Partner scope (read:lineage|read:compliance|read:risk|read:shipments)',
  })
  @ApiOperation({
    summary: 'List partner datasets',
    description:
      'Returns tenant-safe datasets available for external partner reporting and analytics extraction by explicit scope.',
  })
  async listDatasets(@Query('scope') scopeRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    const role = this.requireRole(
      req,
      ['exporter', 'agent'],
      'Only exporters or agents can view partner datasets',
    );
    const scope = this.parseScope(scopeRaw);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const capturedAt = new Date().toISOString();

    const datasetsByScope: Record<AllowedPartnerScope, string[]> = {
      'read:lineage': ['lineage_nodes', 'lineage_edges', 'root_plot_ids'],
      'read:compliance': ['dds_packages', 'filing_activity', 'compliance_status'],
      'read:risk': ['risk_scores', 'yield_flags', 'deforestation_findings'],
      'read:shipments': ['shipment_headers', 'shipment_lines', 'shipment_references'],
    };

    await this.appendAuditEvent(actorUserId, 'partner_dataset_requested', {
      tenantId,
      actorRole: role,
      actorUserId,
      scope,
      datasets: datasetsByScope[scope],
      capturedAt,
    });

    return {
      tenantId,
      scope,
      datasets: datasetsByScope[scope],
      state: 'partner_connection_active',
    };
  }

  @Post('exports')
  @ApiOperation({
    summary: 'Start partner export',
    description:
      'Starts a tenant-safe external partner export run with deterministic idempotency semantics and immutable audit evidence.',
  })
  async startExport(@Body() body: StartPartnerExportBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    const role = this.requireRole(req, ['exporter'], 'Only exporters can start partner exports');
    const dataset = body?.dataset?.trim() ?? '';
    const scope = this.parseScope(body?.scope);
    const format = (body?.format ?? '').toString().toLowerCase();
    const idempotencyKey = body?.idempotencyKey?.trim() ?? '';
    const cursor = body?.cursor?.trim() || null;
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    if (!dataset) {
      throw new BadRequestException('dataset is required');
    }
    if (format !== 'csv' && format !== 'parquet') {
      throw new BadRequestException('format must be csv or parquet');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    let exportRow: PartnerExportRow;
    let replayed = false;
    try {
      const existingResult = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE tenant_id = $1
            AND idempotency_key = $2
          LIMIT 1
        `,
        [tenantId, idempotencyKey],
      );
      if (existingResult.rows[0]) {
        exportRow = existingResult.rows[0] as PartnerExportRow;
        replayed = true;
      } else {
        const insertResult = await this.pool.query<PartnerExportRow>(
          `
          INSERT INTO integration_partner_exports (
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            created_by_user_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', 'partner_sync_pending', NULL, $8)
          RETURNING
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
        `,
        [randomUUID(), tenantId, scope, dataset, format, idempotencyKey, cursor, actorUserId],
      );
        exportRow = insertResult.rows[0] as PartnerExportRow;
      }
      if (!exportRow) {
        throw new BadRequestException('Failed to queue partner export');
      }
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }

    const capturedAt = new Date().toISOString();
    await this.appendAuditEvent(actorUserId, 'partner_dataset_exported', {
      tenantId,
      partnerKey: 'external_analytics_partner',
      scope,
      dataset,
      format,
      cursor,
      exportId: exportRow.id,
      idempotencyKey,
      actorRole: role,
      actorUserId,
      phase: replayed ? 'replayed' : 'queued',
      replayed,
      capturedAt,
    });
    if (replayed) {
      await this.appendAuditEvent(actorUserId, 'partner_sync_replayed', {
        tenantId,
        exportId: exportRow.id,
        idempotencyKey,
        scope,
        dataset,
        actorRole: role,
        actorUserId,
        capturedAt,
      });
    }

    return this.mapExportRowToResponse(exportRow, replayed);
  }

  @Post('exports/:id/finalize')
  @ApiOperation({
    summary: 'Finalize partner export outcome',
    description:
      'Finalizes queued partner export runs to completed or failed states and appends immutable webhook delivery lifecycle evidence.',
  })
  async finalizeExport(
    @Param('id') exportId: string,
    @Body() body: FinalizePartnerExportBody,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    const role = this.requireRole(
      req,
      ['exporter', 'admin', 'compliance_manager'],
      'Only exporter, admin, or compliance manager can finalize partner exports',
    );
    const outcome = (body?.outcome ?? '').trim().toLowerCase();
    const artifactUrl = body?.artifactUrl?.trim() ?? '';
    const errorCode = body?.errorCode?.trim() || null;
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    if (outcome !== 'completed' && outcome !== 'failed') {
      throw new BadRequestException('outcome must be completed or failed');
    }
    if (outcome === 'completed' && !artifactUrl) {
      throw new BadRequestException('artifactUrl is required when outcome is completed');
    }

    let existingRow: PartnerExportRow | undefined;
    try {
      const existingRes = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE id = $1
            AND tenant_id = $2
          LIMIT 1
        `,
        [exportId, tenantId],
      );
      existingRow = existingRes.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!existingRow) {
      throw new BadRequestException('Partner export not found');
    }
    const currentAttemptCount = Number(existingRow.attempt_count ?? 1);
    const exhausted = outcome === 'failed' && currentAttemptCount >= MAX_PARTNER_EXPORT_RETRY_ATTEMPTS;
    const nextRetryAt =
      outcome === 'failed' && !exhausted
        ? new Date(Date.now() + this.computeBackoffMinutes(currentAttemptCount) * 60 * 1000).toISOString()
        : null;

    let updatedRow: PartnerExportRow | undefined;
    try {
      const updateRes = await this.pool.query<PartnerExportRow>(
        `
          UPDATE integration_partner_exports
          SET
            status = $3,
            state = $4,
            artifact_url = $5,
            error_code = $6,
            next_retry_at = $7,
            retry_exhausted_at = $8,
            updated_at = NOW()
          WHERE id = $1
            AND tenant_id = $2
          RETURNING
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
        `,
        [
          exportId,
          tenantId,
          outcome,
          outcome === 'completed'
            ? 'partner_sync_succeeded'
            : exhausted
              ? 'partner_sync_terminal_failed'
              : 'partner_sync_terminal_failed',
          outcome === 'completed' ? artifactUrl : null,
          errorCode,
          nextRetryAt,
          exhausted ? new Date().toISOString() : null,
        ],
      );
      updatedRow = updateRes.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!updatedRow) {
      throw new BadRequestException('Partner export not found');
    }

    const capturedAt = new Date().toISOString();
    await this.appendAuditEvent(
      actorUserId,
      outcome === 'completed' ? 'partner_webhook_delivered' : 'partner_webhook_terminal_failed',
      {
        tenantId,
        exportId: updatedRow.id,
        scope: updatedRow.scope,
        dataset: updatedRow.dataset,
        format: updatedRow.format,
        actorRole: role,
        actorUserId,
        errorCode,
        exhausted,
        capturedAt,
      },
    );
    if (exhausted) {
      await this.appendAuditEvent(actorUserId, 'partner_webhook_terminal_failed', {
        tenantId,
        exportId: updatedRow.id,
        scope: updatedRow.scope,
        dataset: updatedRow.dataset,
        format: updatedRow.format,
        actorRole: role,
        actorUserId,
        errorCode: 'PARTNER_EXPORT_RETRY_EXHAUSTED',
        attemptCount: currentAttemptCount,
        capturedAt,
      });
    }

    return this.mapExportRowToResponse(updatedRow, false);
  }

  @Get('exports/retry-queue')
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Queue size (1-200)' })
  @ApiOperation({
    summary: 'List partner export retry queue',
    description: 'Returns due failed partner exports (`next_retry_at <= now`) in queue order.',
  })
  async listRetryQueue(@Query('limit') limitRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    this.requireRole(
      req,
      ['exporter', 'agent', 'admin', 'compliance_manager'],
      'Only exporter, agent, admin, or compliance manager can view partner export retry queue',
    );
    const limit = limitRaw ? Number(limitRaw) : 50;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200');
    }

    try {
      const res = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE tenant_id = $1
            AND status = 'failed'
            AND next_retry_at IS NOT NULL
            AND next_retry_at <= NOW()
          ORDER BY next_retry_at ASC
          LIMIT $2
        `,
        [tenantId, limit],
      );
      return {
        tenantId,
        limit,
        items: res.rows.map((row) => this.mapExportRowToResponse(row, false)),
      };
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
  }

  @Post('exports/:id/retry')
  @ApiOperation({
    summary: 'Retry failed partner export',
    description:
      'Retries a failed partner export, increments attempt counter, and re-queues the export with deterministic backoff metadata.',
  })
  async retryExport(@Param('id') exportId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    const role = this.requireRole(
      req,
      ['exporter', 'admin', 'compliance_manager'],
      'Only exporter, admin, or compliance manager can retry partner exports',
    );
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    let currentRow: PartnerExportRow | undefined;
    try {
      const readRes = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE id = $1
            AND tenant_id = $2
            AND status = 'failed'
          LIMIT 1
        `,
        [exportId, tenantId],
      );
      currentRow = readRes.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!currentRow) {
      throw new BadRequestException('Failed partner export not found');
    }
    if (Number(currentRow.attempt_count) >= MAX_PARTNER_EXPORT_RETRY_ATTEMPTS) {
      await this.appendAuditEvent(actorUserId, 'partner_webhook_terminal_failed', {
        tenantId,
        exportId: currentRow.id,
        scope: currentRow.scope,
        dataset: currentRow.dataset,
        attemptCount: Number(currentRow.attempt_count),
        actorRole: role,
        actorUserId,
        errorCode: 'PARTNER_EXPORT_RETRY_EXHAUSTED',
        capturedAt: new Date().toISOString(),
      });
      throw new BadRequestException('Partner export retry cap reached');
    }

    let row: PartnerExportRow | undefined;
    try {
      const updateRes = await this.pool.query<PartnerExportRow>(
        `
          UPDATE integration_partner_exports
          SET
            status = 'queued',
            state = 'partner_sync_pending',
            attempt_count = attempt_count + 1,
            error_code = NULL,
            next_retry_at = NULL,
            retry_exhausted_at = NULL,
            updated_at = NOW()
          WHERE id = $1
            AND tenant_id = $2
            AND status = 'failed'
          RETURNING
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
        `,
        [exportId, tenantId],
      );
      row = updateRes.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!row) {
      throw new BadRequestException('Failed partner export not found');
    }

    await this.appendAuditEvent(actorUserId, 'partner_webhook_retryable_failed', {
      tenantId,
      exportId: row.id,
      scope: row.scope,
      dataset: row.dataset,
      attemptCount: Number(row.attempt_count),
      actorRole: role,
      actorUserId,
      capturedAt: new Date().toISOString(),
    });

    return this.mapExportRowToResponse(row, false);
  }

  @Get('exports/retry-summary')
  @ApiOperation({
    summary: 'Get partner export retry summary',
    description: 'Returns tenant-scoped retry diagnostics totals and latest retry pointers.',
  })
  async getRetrySummary(@Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    this.requireRole(
      req,
      ['exporter', 'agent', 'admin', 'compliance_manager'],
      'Only exporter, agent, admin, or compliance manager can view partner export retry summary',
    );
    try {
      const countsRes = await this.pool.query<{
        due_retry_count: string;
        failed_count: string;
        exhausted_count: string;
      }>(
        `
          SELECT
            COUNT(*) FILTER (WHERE status = 'failed' AND next_retry_at IS NOT NULL AND next_retry_at <= NOW())::text AS due_retry_count,
            COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_count,
            COUNT(*) FILTER (WHERE retry_exhausted_at IS NOT NULL)::text AS exhausted_count
          FROM integration_partner_exports
          WHERE tenant_id = $1
        `,
        [tenantId],
      );
      const latestRes = await this.pool.query<{
        id: string;
        status: string;
        attempt_count: number;
        next_retry_at: string | null;
        retry_exhausted_at: string | null;
        updated_at: string;
      }>(
        `
          SELECT id, status, attempt_count, next_retry_at::text, retry_exhausted_at::text, updated_at::text
          FROM integration_partner_exports
          WHERE tenant_id = $1
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [tenantId],
      );
      const lastSweepRes = await this.pool.query<{
        timestamp: string;
        event_type: string;
        payload: {
          sweepExecutionId?: string;
          scannedCount?: number;
          retriedCount?: number;
          schedulerTokenVersion?: string | null;
          status?: 'started' | 'completed' | 'failed';
          errorMessage?: string;
        } | null;
      }>(
        `
          SELECT timestamp::text, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'partner_retry_sweep_started',
            'partner_retry_sweep_completed',
            'partner_retry_sweep_failed'
          )
            AND payload ->> 'tenantId' = $1
          ORDER BY timestamp DESC
          LIMIT 1
        `,
        [tenantId],
      );
      return {
        tenantId,
        maxAttempts: MAX_PARTNER_EXPORT_RETRY_ATTEMPTS,
        dueRetryCount: Number(countsRes.rows[0]?.due_retry_count ?? 0),
        failedCount: Number(countsRes.rows[0]?.failed_count ?? 0),
        exhaustedCount: Number(countsRes.rows[0]?.exhausted_count ?? 0),
        latestRetryActivity: latestRes.rows[0] ?? null,
        lastSweepRun: lastSweepRes.rows[0]
          ? {
              at: lastSweepRes.rows[0].timestamp,
              eventType: lastSweepRes.rows[0].event_type,
              sweepExecutionId: lastSweepRes.rows[0].payload?.sweepExecutionId ?? null,
              status: lastSweepRes.rows[0].payload?.status ?? null,
              scannedCount: Number(lastSweepRes.rows[0].payload?.scannedCount ?? 0),
              retriedCount: Number(lastSweepRes.rows[0].payload?.retriedCount ?? 0),
              schedulerTokenVersion: lastSweepRes.rows[0].payload?.schedulerTokenVersion ?? null,
              errorMessage: lastSweepRes.rows[0].payload?.errorMessage ?? null,
            }
          : null,
      };
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
  }

  @Post('exports/retry-sweep/trigger')
  @ApiOperation({
    summary: 'Trigger partner export retry sweep',
    description:
      'Scheduler-safe endpoint that retries due failed exports up to a bounded limit and emits immutable sweep telemetry.',
  })
  async triggerRetrySweep(
    @Body() body: RetrySweepBody,
    @Req() req: any,
    @Headers('x-tracebud-scheduler-token') schedulerTokenRaw: string | undefined,
  ) {
    this.getSchedulerTokenHeader(schedulerTokenRaw);
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    const role = this.requireRole(
      req,
      ['exporter', 'admin', 'compliance_manager'],
      'Only exporter, admin, or compliance manager can trigger retry sweep',
    );
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const sweepExecutionId = randomUUID();
    const schedulerTokenVersion = process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION?.trim() || null;
    const limit = body?.limit === undefined ? PARTNER_RETRY_SWEEP_DEFAULT_LIMIT : Number(body.limit);
    if (!Number.isFinite(limit) || limit < 1 || limit > PARTNER_RETRY_SWEEP_MAX_LIMIT) {
      throw new BadRequestException(`limit must be between 1 and ${PARTNER_RETRY_SWEEP_MAX_LIMIT}`);
    }
    const startedAt = new Date().toISOString();
    await this.appendAuditEvent(actorUserId, 'partner_retry_sweep_started', {
      tenantId,
      actorRole: role,
      actorUserId,
      sweepExecutionId,
      status: 'started',
      schedulerTokenVersion,
      limit,
      capturedAt: startedAt,
    });
    try {
      const dueRes = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE tenant_id = $1
            AND status = 'failed'
            AND next_retry_at IS NOT NULL
            AND next_retry_at <= NOW()
            AND (retry_exhausted_at IS NULL)
          ORDER BY next_retry_at ASC
          LIMIT $2
        `,
        [tenantId, limit],
      );
      const retriedExportIds: string[] = [];
      for (const row of dueRes.rows) {
        if (Number(row.attempt_count) >= MAX_PARTNER_EXPORT_RETRY_ATTEMPTS) {
          continue;
        }
        const updateRes = await this.pool.query<PartnerExportRow>(
          `
            UPDATE integration_partner_exports
            SET
              status = 'queued',
              state = 'partner_sync_pending',
              attempt_count = attempt_count + 1,
              error_code = NULL,
              next_retry_at = NULL,
              retry_exhausted_at = NULL,
              updated_at = NOW()
            WHERE id = $1
              AND tenant_id = $2
              AND status = 'failed'
            RETURNING id
          `,
          [row.id, tenantId],
        );
        if (updateRes.rows[0]?.id) {
          retriedExportIds.push(updateRes.rows[0].id);
        }
      }
      const capturedAt = new Date().toISOString();
      await this.appendAuditEvent(actorUserId, 'partner_retry_sweep_executed', {
        tenantId,
        actorRole: role,
        actorUserId,
        scannedCount: dueRes.rows.length,
        retriedCount: retriedExportIds.length,
        retriedExportIds,
        schedulerTokenVersion,
        limit,
        capturedAt,
      });
      await this.appendAuditEvent(actorUserId, 'partner_retry_sweep_completed', {
        tenantId,
        actorRole: role,
        actorUserId,
        sweepExecutionId,
        status: 'completed',
        scannedCount: dueRes.rows.length,
        retriedCount: retriedExportIds.length,
        retriedExportIds,
        schedulerTokenVersion,
        limit,
        capturedAt,
      });
      return {
        tenantId,
        schedulerContract: true,
        sweepExecutionId,
        status: 'completed',
        schedulerTokenVersion,
        scannedCount: dueRes.rows.length,
        retriedCount: retriedExportIds.length,
        retriedExportIds,
        limit,
      };
    } catch (error) {
      await this.appendAuditEvent(actorUserId, 'partner_retry_sweep_failed', {
        tenantId,
        actorRole: role,
        actorUserId,
        sweepExecutionId,
        status: 'failed',
        schedulerTokenVersion,
        limit,
        errorMessage: error instanceof Error ? error.message : 'Retry sweep failed',
        capturedAt: new Date().toISOString(),
      });
      this.handleMissingPartnerExportTable(error);
    }
  }

  @Get('exports/:id')
  @ApiOperation({
    summary: 'Get partner export status',
    description: 'Returns tenant-safe partner export status and immutable execution state.',
  })
  async getExportStatus(@Param('id') exportId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    this.requireRole(req, ['exporter', 'agent'], 'Only exporters or agents can view partner export status');

    let row: PartnerExportRow | undefined;
    try {
      const result = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE id = $1
            AND tenant_id = $2
          LIMIT 1
        `,
        [exportId, tenantId],
      );
      row = result.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!row) {
      throw new BadRequestException('Partner export not found');
    }
    return this.mapExportRowToResponse(row, false);
  }

  @Get('exports/:id/download')
  @ApiOperation({
    summary: 'Get partner export download URL',
    description:
      'Returns tenant-safe download artifact reference for completed partner exports; fails closed for non-completed runs.',
  })
  async getExportDownload(@Param('id') exportId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    this.requireRole(req, ['exporter', 'agent'], 'Only exporters or agents can download partner exports');

    let row: PartnerExportRow | undefined;
    try {
      const result = await this.pool.query<PartnerExportRow>(
        `
          SELECT
            id,
            tenant_id,
            scope,
            dataset,
            format,
            idempotency_key,
            cursor,
            status,
            state,
            artifact_url,
            attempt_count,
            error_code,
            next_retry_at::text,
            retry_exhausted_at::text,
            created_by_user_id,
            created_at::text,
            updated_at::text
          FROM integration_partner_exports
          WHERE id = $1
            AND tenant_id = $2
          LIMIT 1
        `,
        [exportId, tenantId],
      );
      row = result.rows[0];
    } catch (error) {
      this.handleMissingPartnerExportTable(error);
    }
    if (!row) {
      throw new BadRequestException('Partner export not found');
    }
    if (row.status !== 'completed' || !row.artifact_url) {
      throw new BadRequestException('Partner export artifact is not ready');
    }

    return {
      exportId: row.id,
      status: row.status,
      dataset: row.dataset,
      format: row.format,
      downloadUrl: row.artifact_url,
      expiresInSeconds: 900,
    };
  }
}

