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
import { Pool } from 'pg';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { PG_POOL } from '../db/db.module';
import {
  buildFarmQuestionnaireMappingRegistryV1,
  buildFarmQuestionnaireSchemaV1,
  type QuestionnairePathway,
} from './coolfarm-sai-v2.schema';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/integrations/coolfarm-sai/v2')
export class CoolFarmSaiV2Controller {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  private readonly maxRetryAttempts = 5;

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  @Get('questionnaire-schema')
  @ApiQuery({
    name: 'pathway',
    required: false,
    enum: ['annuals', 'rice'],
    description: 'Questionnaire pathway. Defaults to annuals.',
  })
  @ApiOperation({
    summary: 'Get V2 farm questionnaire schema',
    description:
      'Returns the versioned Cool Farm + SAI questionnaire schema for shadow-mode V2 implementation.',
  })
  getQuestionnaireSchema(@Query('pathway') pathwayRaw: string | undefined, @Req() req: any) {
    this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can access V2 schema');
    }

    const pathway: QuestionnairePathway = pathwayRaw === 'rice' ? 'rice' : 'annuals';
    return {
      schema: buildFarmQuestionnaireSchemaV1(pathway),
      mappingRegistry: buildFarmQuestionnaireMappingRegistryV1(pathway),
      rollout: {
        featureFlag: 'coolfarm_sai_v2_enabled',
        defaultState: 'off',
        mode: 'shadow',
      },
    };
  }

  @Post('questionnaire-drafts')
  @ApiOperation({
    summary: 'Save V2 questionnaire draft',
    description:
      'Persists or updates a tenant-scoped shadow-mode questionnaire draft using idempotency key uniqueness.',
  })
  async saveQuestionnaireDraft(
    @Body()
    body: {
      pathway?: QuestionnairePathway;
      idempotencyKey?: string;
      farmId?: string | null;
      response?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can save V2 drafts');
    }

    const pathway: QuestionnairePathway = body?.pathway === 'rice' ? 'rice' : 'annuals';
    const idempotencyKey = body?.idempotencyKey?.trim();
    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    const response = body?.response ?? {};
    if (typeof response !== 'object' || Array.isArray(response)) {
      throw new BadRequestException('response must be an object');
    }
    const metadata = body?.metadata ?? {};
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new BadRequestException('metadata must be an object');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const schema = buildFarmQuestionnaireSchemaV1(pathway);
    const mappingRegistry = buildFarmQuestionnaireMappingRegistryV1(pathway);

    try {
      const upsertRes = await this.pool.query<{
        id: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>(
        `
          INSERT INTO integration_questionnaire_v2 (
            tenant_id,
            farm_id,
            pathway,
            schema_id,
            schema_version,
            status,
            idempotency_key,
            response,
            metadata,
            created_by_user_id,
            updated_by_user_id
          )
          VALUES (
            $1,
            NULLIF($2, '')::uuid,
            $3,
            $4,
            $5,
            'draft',
            $6,
            $7::jsonb,
            $8::jsonb,
            $9,
            $9
          )
          ON CONFLICT (tenant_id, idempotency_key)
          DO UPDATE SET
            farm_id = NULLIF($2, '')::uuid,
            pathway = $3,
            schema_id = $4,
            schema_version = $5,
            response = $7::jsonb,
            metadata = $8::jsonb,
            updated_by_user_id = $9,
            updated_at = NOW()
          RETURNING id, status, created_at, updated_at
        `,
        [
          tenantId,
          body?.farmId ?? '',
          pathway,
          schema.schemaId,
          schema.schemaVersion,
          idempotencyKey,
          JSON.stringify(response),
          JSON.stringify(metadata),
          actorUserId,
        ],
      );

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          upsertRes.rows[0]?.id ?? null,
          'integration_v2_questionnaire_draft_saved',
          JSON.stringify({
            tenantId,
            pathway,
            schemaId: schema.schemaId,
            schemaVersion: schema.schemaVersion,
            mappingVersion: mappingRegistry.mappingVersion,
            idempotencyKey,
          }),
          actorUserId,
        ],
      );

      return {
        id: upsertRes.rows[0]?.id ?? null,
        status: upsertRes.rows[0]?.status ?? 'draft',
        pathway,
        schemaId: schema.schemaId,
        schemaVersion: schema.schemaVersion,
        mappingVersion: mappingRegistry.mappingVersion,
        idempotencyKey,
      };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 migration first.',
        );
      }
      throw error;
    }
  }

  @Post('questionnaire-drafts/:id/submit')
  @ApiOperation({
    summary: 'Submit V2 questionnaire draft',
    description:
      'Transitions a tenant-scoped questionnaire from draft to submitted and records validation run lifecycle evidence.',
  })
  async submitQuestionnaireDraft(@Param('id') draftId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can submit V2 drafts');
    }
    if (!draftId?.trim()) {
      throw new BadRequestException('draft id is required');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const draftRes = await this.pool.query<{
        id: string;
        status: string;
      }>(
        `
          SELECT id, status
          FROM integration_questionnaire_v2
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [draftId, tenantId],
      );
      if ((draftRes.rowCount ?? 0) === 0) {
        throw new BadRequestException('V2 questionnaire draft not found');
      }
      const currentStatus = draftRes.rows[0]?.status ?? '';
      if (currentStatus !== 'draft') {
        throw new BadRequestException(`Invalid transition: ${currentStatus} -> submitted`);
      }

      await this.pool.query(
        `
          UPDATE integration_questionnaire_v2
          SET
            status = 'submitted',
            updated_by_user_id = $2,
            updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
        `,
        [draftId, actorUserId, tenantId],
      );

      const runRes = await this.pool.query<{ id: string }>(
        `
          INSERT INTO integration_runs_v2 (
            tenant_id,
            questionnaire_id,
            run_type,
            status,
            details
          )
          VALUES ($1, $2::uuid, 'validation', 'started', $3::jsonb)
          RETURNING id
        `,
        [
          tenantId,
          draftId,
          JSON.stringify({
            phase: 'submit_transition',
            triggeredBy: role,
          }),
        ],
      );
      const runId = runRes.rows[0]?.id ?? null;

      if (runId) {
        await this.pool.query(
          `
            UPDATE integration_runs_v2
            SET
              status = 'completed',
              details = details || $2::jsonb,
              finished_at = NOW(),
              updated_at = NOW()
            WHERE id = $1::uuid
              AND tenant_id = $3
          `,
          [
            runId,
            JSON.stringify({
              result: 'ok',
            }),
            tenantId,
          ],
        );
      }

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          draftId,
          'integration_v2_questionnaire_submitted',
          JSON.stringify({
            tenantId,
            draftId,
            runId,
          }),
          actorUserId,
        ],
      );

      return {
        id: draftId,
        status: 'submitted',
        run: {
          id: runId,
          type: 'validation',
          status: 'completed',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 migration first.',
        );
      }
      throw error;
    }
  }

  @Post('questionnaire-drafts/:id/runs')
  @ApiOperation({
    summary: 'Execute V2 run lifecycle',
    description:
      'Creates and finalizes a tenant-scoped validation/scoring run as completed or failed for shadow diagnostics.',
  })
  async executeQuestionnaireRun(
    @Param('id') draftId: string,
    @Body()
    body: {
      runType?: 'validation' | 'scoring';
      shouldFail?: boolean;
      reason?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can execute V2 runs');
    }
    if (!draftId?.trim()) {
      throw new BadRequestException('draft id is required');
    }
    const runType = body?.runType === 'scoring' ? 'scoring' : 'validation';
    const shouldFail = body?.shouldFail === true;
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    try {
      const draftRes = await this.pool.query<{ id: string; status: string }>(
        `
          SELECT id, status
          FROM integration_questionnaire_v2
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [draftId, tenantId],
      );
      if ((draftRes.rowCount ?? 0) === 0) {
        throw new BadRequestException('V2 questionnaire draft not found');
      }

      const runRes = await this.pool.query<{ id: string }>(
        `
          INSERT INTO integration_runs_v2 (
            tenant_id,
            questionnaire_id,
            run_type,
            status,
            details,
            queued_at,
            attempt_count
          )
          VALUES ($1, $2::uuid, $3, 'started', $4::jsonb, NOW(), $5)
          RETURNING id
        `,
        [
          tenantId,
          draftId,
          runType,
          JSON.stringify({
            triggeredBy: role,
            mode: 'shadow',
          }),
          1,
        ],
      );
      const runId = runRes.rows[0]?.id ?? null;

      if (runId) {
        await this.pool.query(
          `
            UPDATE integration_runs_v2
            SET
              status = $2,
              details = details || $3::jsonb,
              error_code = $4,
              finished_at = NOW(),
              updated_at = NOW()
            WHERE id = $1::uuid
              AND tenant_id = $5
          `,
          [
            runId,
            shouldFail ? 'failed' : 'completed',
            JSON.stringify({
              result: shouldFail ? 'failed' : 'ok',
              reason: shouldFail ? body?.reason ?? 'simulated failure' : null,
            }),
            shouldFail ? 'V2_SHADOW_RUN_FAILED' : null,
            tenantId,
          ],
        );
      }

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          draftId,
          shouldFail ? 'integration_v2_run_failed' : 'integration_v2_run_completed',
          JSON.stringify({
            tenantId,
            draftId,
            runId,
            runType,
            status: shouldFail ? 'failed' : 'completed',
          }),
          actorUserId,
        ],
      );

      return {
        questionnaireId: draftId,
        run: {
          id: runId,
          type: runType,
          status: shouldFail ? 'failed' : 'completed',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 migration first.',
        );
      }
      throw error;
    }
  }

  @Get('questionnaire-drafts/:id/runs')
  @ApiOperation({
    summary: 'List V2 run history',
    description: 'Returns tenant-scoped validation/scoring run history for a questionnaire.',
  })
  async listQuestionnaireRuns(@Param('id') draftId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can view V2 runs');
    }
    if (!draftId?.trim()) {
      throw new BadRequestException('draft id is required');
    }
    try {
      const runsRes = await this.pool.query(
        `
          SELECT id, run_type, status, details, queued_at, attempt_count, error_code, started_at, finished_at
          FROM integration_runs_v2
          WHERE tenant_id = $1
            AND questionnaire_id = $2::uuid
          ORDER BY started_at DESC
        `,
        [tenantId, draftId],
      );
      return {
        questionnaireId: draftId,
        items: runsRes.rows,
      };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 migration first.',
        );
      }
      throw error;
    }
  }

  @Get('runs/summary')
  @ApiOperation({
    summary: 'Get V2 run summary',
    description:
      'Returns tenant-scoped aggregate run counts and latest run pointers for quick operator diagnostics.',
  })
  async getRunSummary(@Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can view V2 run summary');
    }
    try {
      const countRes = await this.pool.query<{
        status: string;
        count: string;
      }>(
        `
          SELECT status, COUNT(*)::text AS count
          FROM integration_runs_v2
          WHERE tenant_id = $1
          GROUP BY status
        `,
        [tenantId],
      );
      const latestRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
        run_type: string;
        status: string;
        started_at: string;
      }>(
        `
          SELECT id, questionnaire_id, run_type, status, started_at
          FROM integration_runs_v2
          WHERE tenant_id = $1
          ORDER BY started_at DESC
          LIMIT 1
        `,
        [tenantId],
      );
      const staleRes = await this.pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM integration_runs_v2
          WHERE tenant_id = $1
            AND claimed_at IS NOT NULL
            AND claimed_at <= NOW() - INTERVAL '60 minutes'
        `,
        [tenantId],
      );
      const lastSweeperRes = await this.pool.query<{
        created_at: string;
        payload: Record<string, unknown> | null;
      }>(
        `
          SELECT created_at, payload
          FROM integration_audit_v2
          WHERE tenant_id = $1
            AND event_type = 'integration_v2_stale_sweeper_executed'
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [tenantId],
      );
      const counts = { started: 0, completed: 0, failed: 0 };
      for (const row of countRes.rows) {
        if (row.status in counts) {
          counts[row.status as keyof typeof counts] = Number(row.count);
        }
      }
      return {
        tenantId,
        counts,
        staleClaimCount: Number(staleRes.rows[0]?.count ?? 0),
        lastSweeperRun: lastSweeperRes.rows[0] ?? null,
        lastSweeperReleasedCount: Number(
          (lastSweeperRes.rows[0]?.payload as { releasedCount?: number } | null)?.releasedCount ?? 0,
        ),
        lastSweeperTriggerSource:
          (lastSweeperRes.rows[0]?.payload as { triggerSource?: string } | null)?.triggerSource ?? null,
        lastSweeperTokenVersion:
          (lastSweeperRes.rows[0]?.payload as { schedulerTokenVersion?: string } | null)
            ?.schedulerTokenVersion ?? null,
        latestRun: latestRes.rows[0] ?? null,
      };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 and TB-V16-014 migrations first.',
        );
      }
      throw error;
    }
  }

  @Post('runs/release-stale')
  @ApiOperation({
    summary: 'Release stale claims',
    description:
      'Releases runs claimed longer than a threshold (minutes) so they return to queue processing.',
  })
  async releaseStaleClaims(
    @Body()
    body: {
      staleMinutes?: number;
      limit?: number;
      triggerSource?: 'manual' | 'scheduled';
      schedulerTokenVersion?: string | null;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can release stale claims');
    }
    const staleMinutes = body?.staleMinutes === undefined ? 60 : Number(body.staleMinutes);
    const limit = body?.limit === undefined ? 50 : Number(body.limit);
    const triggerSource = body?.triggerSource === 'scheduled' ? 'scheduled' : 'manual';
    const schedulerTokenVersion =
      typeof body?.schedulerTokenVersion === 'string' && body.schedulerTokenVersion.trim().length > 0
        ? body.schedulerTokenVersion.trim()
        : null;
    if (!Number.isFinite(staleMinutes) || staleMinutes < 1 || staleMinutes > 1440) {
      throw new BadRequestException('staleMinutes must be between 1 and 1440');
    }
    if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
      throw new BadRequestException('limit must be between 1 and 500');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const staleRowsRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
      }>(
        `
          SELECT id, questionnaire_id
          FROM integration_runs_v2
          WHERE tenant_id = $1
            AND claimed_at IS NOT NULL
            AND claimed_at <= NOW() - ($2::text || ' minutes')::interval
          ORDER BY claimed_at ASC
          LIMIT $3
        `,
        [tenantId, String(staleMinutes), limit],
      );
      const runIds = staleRowsRes.rows.map((row) => row.id).filter((value) => Boolean(value));
      if (runIds.length === 0) {
        await this.pool.query(
          `
            INSERT INTO integration_audit_v2 (
              tenant_id,
              questionnaire_id,
              event_type,
              payload,
              actor_user_id
            )
            VALUES ($1, NULL, $2, $3::jsonb, $4)
          `,
          [
            tenantId,
            'integration_v2_stale_sweeper_executed',
            JSON.stringify({
              tenantId,
              triggerSource,
              schedulerTokenVersion,
              staleMinutes,
              scannedLimit: limit,
              releasedCount: 0,
            }),
            actorUserId,
          ],
        );
        return {
          tenantId,
          staleMinutes,
          scannedLimit: limit,
          triggerSource,
          releasedCount: 0,
          releasedRunIds: [],
        };
      }

      await this.pool.query(
        `
          UPDATE integration_runs_v2
          SET
            claimed_by_user_id = NULL,
            claimed_at = NULL,
            updated_at = NOW(),
            details = details || $3::jsonb
          WHERE tenant_id = $1
            AND id = ANY($2::uuid[])
        `,
        [
          tenantId,
          runIds,
          JSON.stringify({
            staleReleaseMinutes: staleMinutes,
            staleReleasedAt: new Date().toISOString(),
          }),
        ],
      );

      for (const row of staleRowsRes.rows) {
        await this.pool.query(
          `
            INSERT INTO integration_audit_v2 (
              tenant_id,
              questionnaire_id,
              event_type,
              payload,
              actor_user_id
            )
            VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
          `,
          [
            tenantId,
            row.questionnaire_id,
            'integration_v2_run_stale_released',
            JSON.stringify({
              tenantId,
              runId: row.id,
              staleMinutes,
            }),
            actorUserId,
          ],
        );
      }

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, NULL, $2, $3::jsonb, $4)
        `,
        [
          tenantId,
          'integration_v2_stale_sweeper_executed',
          JSON.stringify({
            tenantId,
            triggerSource,
            schedulerTokenVersion,
            staleMinutes,
            scannedLimit: limit,
            releasedCount: runIds.length,
          }),
          actorUserId,
        ],
      );

      return {
        tenantId,
        staleMinutes,
        scannedLimit: limit,
        triggerSource,
        releasedCount: runIds.length,
        releasedRunIds: runIds,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013, TB-V16-014, TB-V16-015, and TB-V16-016 migrations first.',
        );
      }
      throw error;
    }
  }

  @Post('runs/release-stale/trigger')
  @ApiOperation({
    summary: 'Trigger scheduled stale sweeper',
    description:
      'Scheduler-facing contract that executes stale claim release in scheduled mode and returns run summary metadata.',
  })
  async triggerScheduledStaleSweeper(
    @Body()
    body: {
      staleMinutes?: number;
      limit?: number;
    },
    @Headers('x-tracebud-scheduler-token') schedulerTokenRaw: string | undefined,
    @Req() req: any,
  ) {
    const expectedToken = process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN?.trim() ?? '';
    const schedulerToken = schedulerTokenRaw?.trim() ?? '';
    if (!expectedToken) {
      throw new BadRequestException('COOLFARM_SAI_V2_SCHEDULER_TOKEN is not configured');
    }
    if (!schedulerToken || schedulerToken !== expectedToken) {
      throw new ForbiddenException('Invalid scheduler token');
    }

    const schedulerTokenVersion =
      process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION?.trim() || 'unversioned';

    const result = await this.releaseStaleClaims(
      {
        staleMinutes: body?.staleMinutes,
        limit: body?.limit,
        triggerSource: 'scheduled',
        schedulerTokenVersion,
      },
      req,
    );
    return {
      ...result,
      schedulerContract: true,
      schedulerTokenVersion,
    };
  }

  @Get('runs/retry-queue')
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum rows to return (default 50, max 200).',
  })
  @ApiOperation({
    summary: 'List retry-ready runs',
    description:
      'Returns tenant-scoped failed runs that are due for retry (next_retry_at <= now), ordered by earliest due time.',
  })
  async listRetryQueue(@Query('limit') limitRaw: string | undefined, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can view retry queue');
    }
    const limit = limitRaw ? Number(limitRaw) : 50;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200');
    }

    try {
      const queueRes = await this.pool.query(
        `
          SELECT
            id,
            questionnaire_id,
            run_type,
            status,
            attempt_count,
            error_code,
            next_retry_at,
            claimed_by_user_id,
            claimed_at,
            updated_at
          FROM integration_runs_v2
          WHERE tenant_id = $1
            AND status = 'failed'
            AND next_retry_at IS NOT NULL
            AND next_retry_at <= NOW()
            AND claimed_at IS NULL
          ORDER BY next_retry_at ASC, updated_at ASC
          LIMIT $2
        `,
        [tenantId, limit],
      );

      return {
        tenantId,
        limit,
        dueCount: queueRes.rows.length,
        items: queueRes.rows,
      };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013, TB-V16-014, and TB-V16-015 migrations first.',
        );
      }
      throw error;
    }
  }

  @Post('runs/:runId/claim')
  @ApiOperation({
    summary: 'Claim retry run',
    description:
      'Claims a due failed run for processing so parallel workers do not process the same run concurrently.',
  })
  async claimRetryRun(@Param('runId') runId: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can claim V2 runs');
    }
    if (!runId?.trim()) {
      throw new BadRequestException('run id is required');
    }

    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    try {
      const claimRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
        run_type: string;
        status: string;
        claimed_at: string | null;
      }>(
        `
          UPDATE integration_runs_v2
          SET
            claimed_by_user_id = $2,
            claimed_at = NOW(),
            updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $3
            AND status = 'failed'
            AND next_retry_at IS NOT NULL
            AND next_retry_at <= NOW()
            AND claimed_at IS NULL
          RETURNING id, questionnaire_id, run_type, status, claimed_at
        `,
        [runId, actorUserId, tenantId],
      );
      if ((claimRes.rowCount ?? 0) === 0) {
        throw new BadRequestException(
          'Run is not claimable (missing, already claimed, not failed, or not yet due for retry)',
        );
      }

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          claimRes.rows[0]?.questionnaire_id ?? null,
          'integration_v2_run_claimed',
          JSON.stringify({
            tenantId,
            runId,
            questionnaireId: claimRes.rows[0]?.questionnaire_id ?? null,
            claimedAt: claimRes.rows[0]?.claimed_at ?? null,
          }),
          actorUserId,
        ],
      );

      return {
        id: claimRes.rows[0]?.id ?? runId,
        questionnaireId: claimRes.rows[0]?.questionnaire_id ?? null,
        runType: claimRes.rows[0]?.run_type ?? null,
        status: claimRes.rows[0]?.status ?? null,
        claimedAt: claimRes.rows[0]?.claimed_at ?? null,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013, TB-V16-014, TB-V16-015, and TB-V16-016 migrations first.',
        );
      }
      throw error;
    }
  }

  @Post('runs/:runId/release')
  @ApiOperation({
    summary: 'Release claimed run',
    description:
      'Releases a claimed run so it can return to retry queue processing, with timeout-style safety checks.',
  })
  async releaseRun(
    @Param('runId') runId: string,
    @Body()
    body: {
      force?: boolean;
      reason?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can release V2 runs');
    }
    if (!runId?.trim()) {
      throw new BadRequestException('run id is required');
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const force = body?.force === true;

    try {
      const runRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
        status: string;
        claimed_by_user_id: string | null;
        claimed_at: string | null;
      }>(
        `
          SELECT id, questionnaire_id, status, claimed_by_user_id, claimed_at
          FROM integration_runs_v2
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [runId, tenantId],
      );
      if ((runRes.rowCount ?? 0) === 0) {
        throw new BadRequestException('V2 run not found');
      }
      const run = runRes.rows[0];
      if (!run || !run.claimed_at) {
        throw new BadRequestException('Run is not currently claimed');
      }
      if (!force && actorUserId && run.claimed_by_user_id && run.claimed_by_user_id !== actorUserId) {
        throw new BadRequestException('Run is claimed by a different actor; use force=true to release');
      }

      const releaseRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
        status: string;
      }>(
        `
          UPDATE integration_runs_v2
          SET
            claimed_by_user_id = NULL,
            claimed_at = NULL,
            updated_at = NOW(),
            details = details || $3::jsonb
          WHERE id = $1::uuid
            AND tenant_id = $2
          RETURNING id, questionnaire_id, status
        `,
        [
          runId,
          tenantId,
          JSON.stringify({
            releaseReason: body?.reason ?? (force ? 'force_release' : 'standard_release'),
            releasedBy: role,
            releasedAt: new Date().toISOString(),
          }),
        ],
      );

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          releaseRes.rows[0]?.questionnaire_id ?? run.questionnaire_id,
          'integration_v2_run_released',
          JSON.stringify({
            tenantId,
            runId,
            forced: force,
            reason: body?.reason ?? null,
          }),
          actorUserId,
        ],
      );

      return {
        id: releaseRes.rows[0]?.id ?? runId,
        questionnaireId: releaseRes.rows[0]?.questionnaire_id ?? run.questionnaire_id,
        status: releaseRes.rows[0]?.status ?? run.status,
        released: true,
        forced: force,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013, TB-V16-014, TB-V16-015, and TB-V16-016 migrations first.',
        );
      }
      throw error;
    }
  }

  @Post('runs/:runId/retry')
  @ApiOperation({
    summary: 'Retry failed V2 run',
    description:
      'Retries a tenant-scoped failed run by increasing attempt count and re-finalizing status with audit lineage.',
  })
  async retryRun(
    @Param('runId') runId: string,
    @Body()
    body: {
      shouldFail?: boolean;
      reason?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (role !== 'exporter' && role !== 'agent' && role !== 'admin' && role !== 'compliance_manager') {
      throw new ForbiddenException('Only exporter, agent, admin, or compliance manager can retry V2 runs');
    }
    if (!runId?.trim()) {
      throw new BadRequestException('run id is required');
    }
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const shouldFail = body?.shouldFail === true;

    try {
      const runRes = await this.pool.query<{
        id: string;
        questionnaire_id: string;
        run_type: string;
        status: string;
        attempt_count: number;
      }>(
        `
          SELECT id, questionnaire_id, run_type, status, attempt_count
          FROM integration_runs_v2
          WHERE id = $1::uuid
            AND tenant_id = $2
          LIMIT 1
        `,
        [runId, tenantId],
      );
      if ((runRes.rowCount ?? 0) === 0) {
        throw new BadRequestException('V2 run not found');
      }
      const run = runRes.rows[0];
      if (!run || run.status !== 'failed') {
        throw new BadRequestException(`Only failed runs can be retried (current status: ${run?.status ?? 'unknown'})`);
      }

      const nextAttempt = Number(run.attempt_count ?? 0) + 1;
      if (nextAttempt > this.maxRetryAttempts) {
        await this.pool.query(
          `
            INSERT INTO integration_audit_v2 (
              tenant_id,
              questionnaire_id,
              event_type,
              payload,
              actor_user_id
            )
            VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
          `,
          [
            tenantId,
            run.questionnaire_id,
            'integration_v2_run_retry_exhausted',
            JSON.stringify({
              tenantId,
              runId,
              questionnaireId: run.questionnaire_id,
              maxRetryAttempts: this.maxRetryAttempts,
              attemptedCount: nextAttempt,
            }),
            actorUserId,
          ],
        );
        throw new BadRequestException(`Retry limit reached (${this.maxRetryAttempts})`);
      }

      const nextRetryAt = new Date(Date.now() + Math.min(60, 2 ** Math.max(0, nextAttempt - 1)) * 60_000);
      await this.pool.query(
        `
          UPDATE integration_runs_v2
          SET
            status = 'started',
            attempt_count = $2,
            queued_at = NOW(),
            next_retry_at = $3,
            error_code = NULL,
            details = details || $4::jsonb,
            updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $5
        `,
        [
          runId,
          nextAttempt,
          nextRetryAt.toISOString(),
          JSON.stringify({
            retriedBy: role,
            retryRequestedAt: new Date().toISOString(),
            backoffMinutes: Math.min(60, 2 ** Math.max(0, nextAttempt - 1)),
          }),
          tenantId,
        ],
      );

      await this.pool.query(
        `
          UPDATE integration_runs_v2
          SET
            status = $2,
            details = details || $3::jsonb,
            error_code = $4,
            next_retry_at = CASE WHEN $2 = 'failed' THEN $6::timestamptz ELSE NULL END,
            finished_at = NOW(),
            updated_at = NOW()
          WHERE id = $1::uuid
            AND tenant_id = $5
        `,
        [
          runId,
          shouldFail ? 'failed' : 'completed',
          JSON.stringify({
            retryResult: shouldFail ? 'failed' : 'ok',
            reason: shouldFail ? body?.reason ?? 'simulated retry failure' : null,
            attemptCount: nextAttempt,
          }),
          shouldFail ? 'V2_SHADOW_RETRY_FAILED' : null,
          tenantId,
          nextRetryAt.toISOString(),
        ],
      );

      await this.pool.query(
        `
          INSERT INTO integration_audit_v2 (
            tenant_id,
            questionnaire_id,
            event_type,
            payload,
            actor_user_id
          )
          VALUES ($1, $2::uuid, $3, $4::jsonb, $5)
        `,
        [
          tenantId,
          run.questionnaire_id,
          shouldFail ? 'integration_v2_run_retry_failed' : 'integration_v2_run_retry_completed',
          JSON.stringify({
            tenantId,
            runId,
            questionnaireId: run.questionnaire_id,
            runType: run.run_type,
            attemptCount: nextAttempt,
            status: shouldFail ? 'failed' : 'completed',
          }),
          actorUserId,
        ],
      );

      return {
        runId,
        questionnaireId: run.questionnaire_id,
        runType: run.run_type,
        attemptCount: nextAttempt,
        status: shouldFail ? 'failed' : 'completed',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException(
          'V2 questionnaire persistence tables are not available. Apply TB-V16-013 and TB-V16-014 migrations first.',
        );
      }
      throw error;
    }
  }
}

