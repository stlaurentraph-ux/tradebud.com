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
type ImportYieldBenchmarkRow = CreateYieldBenchmarkBody;
type ImportYieldBenchmarksBody = {
  rows?: ImportYieldBenchmarkRow[];
};
type SyncYieldBenchmarksBody = {
  sourceType?: YieldSourceType;
  commodity?: string;
  geography?: string;
  year?: string;
  dryRun?: boolean;
};
type ImportRunStatus = 'started' | 'completed' | 'failed';
type FaostatDataRow = Record<string, unknown>;

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

  private normalizeYieldBenchmarkImportRow(row: ImportYieldBenchmarkRow, index: number) {
    const commodity = this.normalizeNonEmptyString(row?.commodity, `rows[${index}].commodity`);
    const geography = this.normalizeNonEmptyString(row?.geography, `rows[${index}].geography`);
    const sourceType = this.normalizeNonEmptyString(
      row?.sourceType,
      `rows[${index}].sourceType`,
    ) as YieldSourceType;
    if (!this.sourceTypes.includes(sourceType)) {
      throw new BadRequestException(
        `rows[${index}].sourceType must be one of: ${this.sourceTypes.join(', ')}`,
      );
    }
    const sourceReference = this.normalizeNonEmptyString(
      row?.sourceReference,
      `rows[${index}].sourceReference`,
    );
    this.validateSourceReference(sourceType, sourceReference);
    const yieldLowerKgHa = this.parseFiniteNumber(
      row?.yieldLowerKgHa,
      `rows[${index}].yieldLowerKgHa`,
    );
    const yieldUpperKgHa = this.parseFiniteNumber(
      row?.yieldUpperKgHa,
      `rows[${index}].yieldUpperKgHa`,
    );
    if (yieldLowerKgHa > yieldUpperKgHa) {
      throw new BadRequestException(
        `rows[${index}].yieldLowerKgHa must be <= rows[${index}].yieldUpperKgHa`,
      );
    }
    const seasonalityFactor =
      row?.seasonalityFactor === undefined
        ? 1
        : this.parseFiniteNumber(row?.seasonalityFactor, `rows[${index}].seasonalityFactor`);
    if (seasonalityFactor <= 0) {
      throw new BadRequestException(`rows[${index}].seasonalityFactor must be > 0`);
    }
    const reviewCadence = this.normalizeNonEmptyString(
      row?.reviewCadence ?? 'annual',
      `rows[${index}].reviewCadence`,
    );
    return {
      commodity,
      geography,
      sourceType,
      sourceReference,
      yieldLowerKgHa,
      yieldUpperKgHa,
      seasonalityFactor,
      reviewCadence,
    };
  }

  private async importRowsAsDrafts(rows: ImportYieldBenchmarkRow[], actorUserId: string | null) {
    let created = 0;
    let updated = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const normalized = this.normalizeYieldBenchmarkImportRow(rows[index] ?? {}, index);
      const existingDraftRes = await this.pool.query<{ id: string }>(
        `
          SELECT id
          FROM yield_benchmarks
          WHERE active = FALSE
            AND LOWER(commodity) = LOWER($1)
            AND LOWER(geography) = LOWER($2)
            AND source_type = $3
            AND source_reference = $4
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [
          normalized.commodity,
          normalized.geography,
          normalized.sourceType,
          normalized.sourceReference,
        ],
      );

      if ((existingDraftRes.rowCount ?? 0) > 0) {
        await this.pool.query(
          `
            UPDATE yield_benchmarks
            SET
              yield_lower_kg_ha = $2,
              yield_upper_kg_ha = $3,
              seasonality_factor = $4,
              review_cadence = $5,
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            existingDraftRes.rows[0].id,
            String(normalized.yieldLowerKgHa),
            String(normalized.yieldUpperKgHa),
            String(normalized.seasonalityFactor),
            normalized.reviewCadence,
          ],
        );
        updated += 1;
      } else {
        await this.pool.query(
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
          `,
          [
            normalized.commodity,
            normalized.geography,
            normalized.sourceType,
            normalized.sourceReference,
            String(normalized.yieldLowerKgHa),
            String(normalized.yieldUpperKgHa),
            String(normalized.seasonalityFactor),
            normalized.reviewCadence,
            actorUserId,
          ],
        );
        created += 1;
      }
    }
    return { created, updated };
  }

  private async createImportRun(
    actorUserId: string | null,
    sourceType: YieldSourceType,
    rowCount: number,
    metadata: Record<string, unknown>,
  ): Promise<string | null> {
    try {
      const res = await this.pool.query<{ id: string }>(
        `
          INSERT INTO yield_benchmark_import_runs (
            source_type,
            status,
            row_count,
            actor_user_id,
            metadata,
            started_at
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
          RETURNING id
        `,
        [sourceType, 'started', rowCount, actorUserId, JSON.stringify(metadata)],
      );
      return res.rows[0]?.id ?? null;
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  private async finalizeImportRun(
    runId: string | null,
    status: ImportRunStatus,
    details: Record<string, unknown>,
  ): Promise<void> {
    if (!runId) {
      return;
    }
    try {
      await this.pool.query(
        `
          UPDATE yield_benchmark_import_runs
          SET
            status = $2,
            details = $3::jsonb,
            finished_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [runId, status, JSON.stringify(details)],
      );
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code !== '42P01') {
        throw error;
      }
    }
  }

  private async pullRowsFromSource(body: SyncYieldBenchmarksBody): Promise<ImportYieldBenchmarkRow[]> {
    const sourceType = this.normalizeNonEmptyString(body?.sourceType, 'sourceType') as YieldSourceType;
    if (sourceType !== 'USDA_FAS' && sourceType !== 'FAOSTAT') {
      throw new BadRequestException('sourceType must be USDA_FAS or FAOSTAT for source sync');
    }
    const baseUrlRaw =
      sourceType === 'USDA_FAS'
        ? process.env.YIELD_BENCHMARKS_USDA_FAS_URL
        : process.env.YIELD_BENCHMARKS_FAOSTAT_URL;
    if (sourceType === 'FAOSTAT' && (!baseUrlRaw || !baseUrlRaw.trim())) {
      return this.pullRowsDirectFromFaostat(body);
    }
    const baseUrl = this.normalizeNonEmptyString(baseUrlRaw, 'source endpoint url');
    const url = new URL(baseUrl);
    if (body?.commodity) {
      url.searchParams.set('commodity', body.commodity.trim());
    }
    if (body?.geography) {
      url.searchParams.set('geography', body.geography.trim());
    }

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new BadRequestException(`Source sync failed with status ${response.status}`);
    }
    const payload = (await response.json()) as { rows?: Record<string, unknown>[] };
    const incomingRows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (incomingRows.length === 0) {
      return [];
    }
    return incomingRows.map((row) => {
      const commodity = String(row.commodity ?? row['commodity_code'] ?? '').trim();
      const geography = String(row.geography ?? row['country'] ?? '').trim();
      const sourceReference = String(
        row.sourceReference ?? row['source_reference'] ?? row['source_url'] ?? url.toString(),
      ).trim();
      return {
        commodity,
        geography,
        sourceType,
        sourceReference,
        yieldLowerKgHa: Number(row.yieldLowerKgHa ?? row['yield_lower_kg_ha']),
        yieldUpperKgHa: Number(row.yieldUpperKgHa ?? row['yield_upper_kg_ha']),
        seasonalityFactor:
          row.seasonalityFactor === undefined && row['seasonality_factor'] === undefined
            ? 1
            : Number(row.seasonalityFactor ?? row['seasonality_factor']),
        reviewCadence: String(row.reviewCadence ?? row['review_cadence'] ?? 'annual').trim(),
      };
    });
  }

  private async pullRowsDirectFromFaostat(body: SyncYieldBenchmarksBody): Promise<ImportYieldBenchmarkRow[]> {
    const baseUrl =
      (process.env.YIELD_BENCHMARKS_FAOSTAT_DIRECT_URL ?? '').trim() ||
      'https://faostatservices.fao.org/api/v1/en/data/QCL';
    const url = new URL(baseUrl);
    // FAOSTAT data endpoint expects canonical filter keys: area, item, element, year.
    // Default commodity is coffee green (656) and element is yield filter code (2413).
    url.searchParams.set('item', (body?.commodity ?? '656').trim());
    url.searchParams.set('element', '2413');
    if (body?.geography) {
      url.searchParams.set('area', body.geography.trim());
    }
    const year = (body?.year ?? '').trim() || (new Date().getUTCFullYear() - 1).toString();
    url.searchParams.set('year', year);
    url.searchParams.set('page_size', '200');

    const bearerToken = await this.resolveFaostatBearerToken();
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });
    if (!response.ok) {
      throw new BadRequestException(`FAOSTAT direct sync failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { data?: FaostatDataRow[] };
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    if (rows.length === 0) {
      return [];
    }

    const normalizedRows: ImportYieldBenchmarkRow[] = [];
    for (const row of rows) {
      const upper = Number(
        row.value ?? row['Value'] ?? row['yield_upper_kg_ha'] ?? row['Value'.toLowerCase()],
      );
      if (!Number.isFinite(upper) || upper <= 0) {
        continue;
      }
      const geography = String(
        row.area ??
          row['area'] ??
          row.area_code ??
          row['area_code'] ??
          row['Area Code'] ??
          row['Area'],
      ).trim();
      const commodity = String(
        row.item ??
          row['item'] ??
          row.item_code ??
          row['item_code'] ??
          row['Item Code'] ??
          row['Item'] ??
          body?.commodity ??
          '656',
      ).trim();
      const sourceReference = `report:faostat-qcl-item-${commodity}-area-${geography || 'all'}-year-${year}`;
      const unit = String(row.unit ?? row['Unit'] ?? '').toLowerCase();
      const upperKgHa = unit.includes('hg/ha') ? upper / 10 : upper;
      normalizedRows.push({
        commodity,
        geography,
        sourceType: 'FAOSTAT',
        sourceReference,
        yieldLowerKgHa: Math.max(1, Math.round(upperKgHa * 0.6)),
        yieldUpperKgHa: Math.max(1, Math.round(upperKgHa)),
        seasonalityFactor: 1,
        reviewCadence: 'annual',
      });
    }
    return normalizedRows;
  }

  private async resolveFaostatBearerToken(): Promise<string> {
    const username = (process.env.YIELD_BENCHMARKS_FAOSTAT_USERNAME ?? '').trim();
    const password = (process.env.YIELD_BENCHMARKS_FAOSTAT_PASSWORD ?? '').trim();
    if (!username || !password) {
      const staticToken = (process.env.YIELD_BENCHMARKS_FAOSTAT_BEARER_TOKEN ?? '').trim();
      if (staticToken) {
        return staticToken;
      }
      throw new BadRequestException(
        'Provide YIELD_BENCHMARKS_FAOSTAT_BEARER_TOKEN or YIELD_BENCHMARKS_FAOSTAT_USERNAME/YIELD_BENCHMARKS_FAOSTAT_PASSWORD for FAOSTAT direct sync',
      );
    }

    const loginUrl =
      (process.env.YIELD_BENCHMARKS_FAOSTAT_LOGIN_URL ?? '').trim() ||
      'https://faostatservices.fao.org/api/v1/auth/login';
    const formBody = new URLSearchParams();
    formBody.set('username', username);
    formBody.set('password', password);
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });
    if (!loginResponse.ok) {
      throw new BadRequestException(`FAOSTAT login failed with status ${loginResponse.status}`);
    }
    const payload = (await loginResponse.json()) as Record<string, unknown>;
    const authenticationResult =
      payload.AuthenticationResult && typeof payload.AuthenticationResult === 'object'
        ? (payload.AuthenticationResult as Record<string, unknown>)
        : null;
    const token =
      String(
        authenticationResult?.AccessToken ??
          authenticationResult?.accessToken ??
          authenticationResult?.access_token ??
          authenticationResult?.token ??
          authenticationResult?.id_token ??
        payload.access_token ??
          payload.token ??
          payload.accessToken ??
          payload.id_token ??
          '',
      ).trim();
    if (!token) {
      throw new BadRequestException('FAOSTAT login response did not include an access token');
    }
    return token;
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

  @Post('import')
  @ApiOperation({
    summary: 'Import yield benchmark drafts',
    description:
      'Imports benchmark rows into inactive draft records using idempotent draft upsert semantics and appends immutable import audit events.',
  })
  async importBenchmarks(@Body() body: ImportYieldBenchmarksBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const actor = this.requireInternalBenchmarkAdmin(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (rows.length === 0) {
      throw new BadRequestException('rows must contain at least one import row');
    }

    await this.appendAuditEvent(actorUserId, 'yield_benchmark_import_started', {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      rowCount: rows.length,
      capturedAt: new Date().toISOString(),
    });

    const { created, updated } = await this.importRowsAsDrafts(rows, actorUserId);

    await this.appendAuditEvent(actorUserId, 'yield_benchmark_import_completed', {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      rowCount: rows.length,
      createdCount: created,
      updatedCount: updated,
      capturedAt: new Date().toISOString(),
    });

    return {
      imported: rows.length,
      created,
      updated,
      status: 'imported',
    };
  }

  @Post('import/sync-source')
  @ApiOperation({
    summary: 'Sync benchmark rows from external source',
    description:
      'Pulls benchmark rows from configured USDA/FAOSTAT source adapter endpoint and imports them as inactive drafts with auditable run metadata.',
  })
  async syncBenchmarksFromSource(@Body() body: SyncYieldBenchmarksBody, @Req() req: any) {
    const tenantId = this.getTenantClaim(req);
    const actor = this.requireInternalBenchmarkAdmin(req);
    const actorUserId = (req?.user?.id as string | undefined) ?? null;
    const sourceType = this.normalizeNonEmptyString(body?.sourceType, 'sourceType') as YieldSourceType;
    const dryRun = body?.dryRun === true;

    const rows = await this.pullRowsFromSource(body);
    const runId = await this.createImportRun(actorUserId, sourceType, rows.length, {
      tenantId,
      actorRole: actor.role,
      actorEmail: actor.email,
      policyMode: actor.policyMode,
      actorUserId,
      dryRun,
      commodity: body?.commodity ?? null,
      geography: body?.geography ?? null,
    });
    if (rows.length === 0) {
      await this.finalizeImportRun(runId, 'completed', {
        imported: 0,
        created: 0,
        updated: 0,
        dryRun,
      });
      return { runId, imported: 0, created: 0, updated: 0, dryRun, status: 'completed' };
    }
    try {
      const result = dryRun
        ? { created: 0, updated: 0 }
        : await this.importRowsAsDrafts(rows, actorUserId);
      await this.finalizeImportRun(runId, 'completed', {
        imported: rows.length,
        created: result.created,
        updated: result.updated,
        dryRun,
      });
      await this.appendAuditEvent(actorUserId, 'yield_benchmark_sync_completed', {
        runId,
        tenantId,
        sourceType,
        imported: rows.length,
        created: result.created,
        updated: result.updated,
        dryRun,
        capturedAt: new Date().toISOString(),
      });
      return {
        runId,
        imported: rows.length,
        created: result.created,
        updated: result.updated,
        dryRun,
        status: 'completed',
      };
    } catch (error) {
      await this.finalizeImportRun(runId, 'failed', {
        imported: rows.length,
        dryRun,
        message: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  }

  @Get('import-runs')
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Optional max rows (default 20, max 100).' })
  @ApiOperation({
    summary: 'List benchmark import runs',
    description: 'Returns recent source-ingestion run records for diagnostics and replay workflows.',
  })
  async listImportRuns(@Query('limit') limitRaw: string | undefined, @Req() req: any) {
    this.getTenantClaim(req);
    this.requireInternalBenchmarkAdmin(req);
    const parsed = limitRaw === undefined ? 20 : Number(limitRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('limit must be a positive number when provided');
    }
    const limit = Math.min(100, Math.floor(parsed));
    try {
      const result = await this.pool.query(
        `
          SELECT id, source_type, status, row_count, actor_user_id, metadata, details, started_at, finished_at, created_at, updated_at
          FROM yield_benchmark_import_runs
          ORDER BY started_at DESC
          LIMIT $1
        `,
        [limit],
      );
      return { items: result.rows };
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        return { items: [] };
      }
      throw error;
    }
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
