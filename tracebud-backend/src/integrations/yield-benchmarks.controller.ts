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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser, type AppRole } from '../auth/roles';
import { PG_POOL } from '../db/db.module';

type YieldSourceType = 'SPONSOR_OVERRIDE' | 'NATIONAL_STATS' | 'USDA_FAS' | 'FAOSTAT';

type CreateYieldBenchmarkBody = {
  commodity?: string;
  geography?: string;
  sourceType?: YieldSourceType;
  sourceReference?: string;
  yieldLowerKgHa?: number;
  yieldUpperKgHa?: number;
  seasonalityFactor?: number;
  reviewCadence?: string;
};

type UpdateYieldBenchmarkBody = Partial<CreateYieldBenchmarkBody>;

@ApiTags('YieldBenchmarks')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/yield-benchmarks')
export class YieldBenchmarksController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private readonly sourceTypes: YieldSourceType[] = ['SPONSOR_OVERRIDE', 'NATIONAL_STATS', 'USDA_FAS', 'FAOSTAT'];

  private getTenantClaim(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private requireInternalBenchmarkAdmin(req: any) {
    const role = deriveRoleFromSupabaseUser(req?.user);
    const allowedRoles: AppRole[] = ['admin', 'compliance_manager'];
    const email = (req?.user?.email as string | undefined)?.toLowerCase() ?? '';
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('Only internal benchmark admins can manage yield benchmarks');
    }
    return { role, email, policyMode: 'claim' as const };
  }

  private normalizeNonEmptyString(value: unknown, fieldName: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return normalized;
  }

  private parseFiniteNumber(value: unknown, fieldName: string) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a finite number`);
    }
    return parsed;
  }

  private validateSourceReference(sourceType: YieldSourceType, sourceReference: string) {
    if (sourceType === 'SPONSOR_OVERRIDE') {
      return;
    }
    const hasUrl = /^https?:\/\/\S+$/i.test(sourceReference);
    const hasPublicationId = /^(doi:|isbn:|issn:|report:|publication:)/i.test(sourceReference);
    if (!hasUrl && !hasPublicationId) {
      throw new BadRequestException(
        'sourceReference must be a citable URL or publication identifier for NATIONAL_STATS, USDA_FAS, and FAOSTAT',
      );
    }
  }

  private async appendAuditEvent(actorUserId: string | null, eventType: string, payload: Record<string, unknown>) {
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

  @Post()
  @ApiOperation({
    summary: 'Create yield benchmark draft',
    description:
      'Creates an inactive yield benchmark draft. Source-reference traceability and numeric plausibility checks are enforced at write time.',
  })
  async createBenchmark(@Body() body: CreateYieldBenchmarkBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const actor = this.requireInternalBenchmarkAdmin(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    const commodity = this.normalizeNonEmptyString(body?.commodity, 'commodity');
    const geography = this.normalizeNonEmptyString(body?.geography, 'geography');
    const sourceType = this.normalizeNonEmptyString(body?.sourceType, 'sourceType') as YieldSourceType;
    if (!this.sourceTypes.includes(sourceType)) {
      throw new BadRequestException(`sourceType must be one of: ${this.sourceTypes.join(', ')}`);
    }
    const sourceReference = this.normalizeNonEmptyString(body?.sourceReference, 'sourceReference');
    this.validateSourceReference(sourceType, sourceReference);
    const yieldLowerKgHa = this.parseFiniteNumber(body?.yieldLowerKgHa, 'yieldLowerKgHa');
    const yieldUpperKgHa = this.parseFiniteNumber(body?.yieldUpperKgHa, 'yieldUpperKgHa');
    if (yieldLowerKgHa > yieldUpperKgHa) {
      throw new BadRequestException('yieldLowerKgHa must be <= yieldUpperKgHa');
    }
    const seasonalityFactor =
      body?.seasonalityFactor === undefined ? 1 : this.parseFiniteNumber(body?.seasonalityFactor, 'seasonalityFactor');
    if (seasonalityFactor <= 0) {
      throw new BadRequestException('seasonalityFactor must be > 0');
    }
    const reviewCadence = this.normalizeNonEmptyString(body?.reviewCadence ?? 'annual', 'reviewCadence');

    const insertRes = await this.pool.query<{
      id: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `
        INSERT INTO yield_benchmarks (
          commodity,
          geography,
          source_type,
          source_reference,
          yield_lower_kg_ha,
          yield_upper_kg_ha,
          seasonality_factor,
          review_cadence,
          active,
          created_by_user_id,
          approved_by_user_id,
          approved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, NULL, NULL)
        RETURNING id, active, created_at, updated_at
      `,
      [
        commodity,
        geography,
        sourceType,
        sourceReference,
        String(yieldLowerKgHa),
        String(yieldUpperKgHa),
        String(seasonalityFactor),
        reviewCadence,
        actorUserId,
      ],
    );

    const created = insertRes.rows[0];
    await this.appendAuditEvent(actorUserId, 'yield_benchmark_created', {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      benchmarkId: created.id,
      commodity,
      geography,
      sourceType,
      active: false,
      capturedAt: new Date().toISOString(),
    });

    return {
      id: created.id,
      active: created.active,
      status: 'draft',
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update yield benchmark draft',
    description:
      'Updates a yield benchmark while inactive. Active records are immutable and must be superseded through a new draft and activation flow.',
  })
  async updateBenchmark(@Param('id') id: string, @Body() body: UpdateYieldBenchmarkBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const actor = this.requireInternalBenchmarkAdmin(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;

    const existingRes = await this.pool.query<{
      id: string;
      active: boolean;
      source_type: YieldSourceType;
      source_reference: string;
      commodity: string;
      geography: string;
      review_cadence: string;
      seasonality_factor: string;
      yield_lower_kg_ha: string;
      yield_upper_kg_ha: string;
    }>(
      `
        SELECT id, active, source_type, source_reference, commodity, geography, review_cadence, seasonality_factor, yield_lower_kg_ha, yield_upper_kg_ha
        FROM yield_benchmarks
        WHERE id = $1
      `,
      [id],
    );
    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Yield benchmark not found');
    }
    const existing = existingRes.rows[0];
    if (existing.active) {
      throw new BadRequestException('Active yield benchmarks are immutable; create a new draft instead');
    }

    const nextCommodity = body.commodity === undefined ? existing.commodity : this.normalizeNonEmptyString(body.commodity, 'commodity');
    const nextGeography = body.geography === undefined ? existing.geography : this.normalizeNonEmptyString(body.geography, 'geography');
    const nextSourceType =
      body.sourceType === undefined
        ? existing.source_type
        : (this.normalizeNonEmptyString(body.sourceType, 'sourceType') as YieldSourceType);
    if (!this.sourceTypes.includes(nextSourceType)) {
      throw new BadRequestException(`sourceType must be one of: ${this.sourceTypes.join(', ')}`);
    }
    const nextSourceReference =
      body.sourceReference === undefined ? existing.source_reference : this.normalizeNonEmptyString(body.sourceReference, 'sourceReference');
    this.validateSourceReference(nextSourceType, nextSourceReference);
    const nextLower =
      body.yieldLowerKgHa === undefined ? Number(existing.yield_lower_kg_ha) : this.parseFiniteNumber(body.yieldLowerKgHa, 'yieldLowerKgHa');
    const nextUpper =
      body.yieldUpperKgHa === undefined ? Number(existing.yield_upper_kg_ha) : this.parseFiniteNumber(body.yieldUpperKgHa, 'yieldUpperKgHa');
    if (nextLower > nextUpper) {
      throw new BadRequestException('yieldLowerKgHa must be <= yieldUpperKgHa');
    }
    const nextSeasonality =
      body.seasonalityFactor === undefined
        ? Number(existing.seasonality_factor)
        : this.parseFiniteNumber(body.seasonalityFactor, 'seasonalityFactor');
    if (nextSeasonality <= 0) {
      throw new BadRequestException('seasonalityFactor must be > 0');
    }
    const nextReviewCadence =
      body.reviewCadence === undefined ? existing.review_cadence : this.normalizeNonEmptyString(body.reviewCadence, 'reviewCadence');

    const updateRes = await this.pool.query<{ updated_at: string }>(
      `
        UPDATE yield_benchmarks
        SET
          commodity = $2,
          geography = $3,
          source_type = $4,
          source_reference = $5,
          yield_lower_kg_ha = $6,
          yield_upper_kg_ha = $7,
          seasonality_factor = $8,
          review_cadence = $9,
          updated_at = NOW()
        WHERE id = $1
        RETURNING updated_at
      `,
      [
        id,
        nextCommodity,
        nextGeography,
        nextSourceType,
        nextSourceReference,
        String(nextLower),
        String(nextUpper),
        String(nextSeasonality),
        nextReviewCadence,
      ],
    );

    await this.appendAuditEvent(actorUserId, 'yield_benchmark_updated', {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      benchmarkId: id,
      active: false,
      capturedAt: new Date().toISOString(),
    });

    return {
      id,
      active: false,
      status: 'draft',
      updatedAt: updateRes.rows[0]?.updated_at ?? new Date().toISOString(),
    };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate yield benchmark draft',
    description:
      'Activates a benchmark draft using dual-control approval. The approver must differ from the original creator.',
  })
  async activateBenchmark(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const actor = this.requireInternalBenchmarkAdmin(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    if (!actorUserId) {
      throw new ForbiddenException('User id claim is required for benchmark activation');
    }

    const existingRes = await this.pool.query<{ id: string; active: boolean; created_by_user_id: string | null }>(
      `
        SELECT id, active, created_by_user_id
        FROM yield_benchmarks
        WHERE id = $1
      `,
      [id],
    );
    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Yield benchmark not found');
    }
    const existing = existingRes.rows[0];
    if (existing.active) {
      return { id, active: true, status: 'active' };
    }
    if (existing.created_by_user_id && existing.created_by_user_id === actorUserId) {
      throw new ForbiddenException('Dual-control violation: approver must differ from creator');
    }

    await this.pool.query(
      `
        UPDATE yield_benchmarks
        SET
          active = TRUE,
          approved_by_user_id = $2,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [id, actorUserId],
    );

    await this.appendAuditEvent(actorUserId, 'yield_benchmark_activated', {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      benchmarkId: id,
      active: true,
      capturedAt: new Date().toISOString(),
    });

    return { id, active: true, status: 'active' };
  }

  @Get()
  @ApiQuery({ name: 'active', required: false, type: String, description: 'Optional active filter (`true` or `false`).' })
  @ApiOperation({
    summary: 'List yield benchmarks',
    description: 'Lists yield benchmark records for internal benchmark administration workflows.',
  })
  async listBenchmarks(@Query('active') activeRaw: string | undefined, @Req() req: any) {
    this.getTenantClaim(req);
    this.requireInternalBenchmarkAdmin(req);

    let activeFilter: boolean | null = null;
    if (activeRaw !== undefined) {
      if (activeRaw !== 'true' && activeRaw !== 'false') {
        throw new BadRequestException('active must be `true` or `false` when provided');
      }
      activeFilter = activeRaw === 'true';
    }

    const result = await this.pool.query(
      `
        SELECT id, commodity, geography, source_type, source_reference, yield_lower_kg_ha, yield_upper_kg_ha, seasonality_factor, review_cadence, active, created_at, updated_at, approved_at
        FROM yield_benchmarks
        WHERE ($1::boolean IS NULL OR active = $1)
        ORDER BY updated_at DESC
      `,
      [activeFilter],
    );

    return { items: result.rows };
  }
}
