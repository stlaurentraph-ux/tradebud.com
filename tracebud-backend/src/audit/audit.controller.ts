import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/audit')
export class AuditController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private async appendGatedEntryExportAuditEvent(params: {
    userId: string | null;
    exportedBy: string | null;
    tenantId: string;
    gate: 'request_campaigns' | 'annual_reporting' | undefined;
    fromHours: number;
    sort: 'desc' | 'asc';
    rowCount: number;
    rowLimit: number;
    truncated: boolean;
  }) {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
        `,
        [
          params.userId,
          'dashboard-web',
          'dashboard_gated_entry_exported',
          JSON.stringify({
            tenantId: params.tenantId,
            gate: params.gate ?? 'all',
            fromHours: params.fromHours,
            sort: params.sort,
            rowCount: params.rowCount,
            rowLimit: params.rowLimit,
            truncated: params.truncated,
            format: 'csv',
            exportedBy: params.exportedBy,
            exportedAt: new Date().toISOString(),
          }),
        ],
      );
    } catch {
      // Export delivery should not fail if metadata audit append fails.
    }
  }

  private parseGatedEntryFilters(
    req: any,
    gate: 'request_campaigns' | 'annual_reporting' | undefined,
    fromHoursRaw: string | undefined,
    sortRaw: 'desc' | 'asc' | undefined,
  ) {
    const tenantId = this.getTenantClaim(req);
    const fromHours = fromHoursRaw ? Number(fromHoursRaw) : 24 * 7;
    if (!Number.isFinite(fromHours) || fromHours < 1 || fromHours > 24 * 30) {
      throw new BadRequestException('fromHours must be between 1 and 720.');
    }
    const normalizedSort = (sortRaw ?? 'desc').toLowerCase();
    if (normalizedSort !== 'desc' && normalizedSort !== 'asc') {
      throw new BadRequestException('sort must be desc or asc.');
    }
    const sort: 'desc' | 'asc' = normalizedSort;
    if (gate && gate !== 'request_campaigns' && gate !== 'annual_reporting') {
      throw new BadRequestException('gate must be request_campaigns or annual_reporting.');
    }
    return { tenantId, fromHours, sort, gate };
  }

  private getTenantClaim(req: any): string {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    return tenantId;
  }

  private requireTenantClaim(req: any) {
    this.getTenantClaim(req);
  }

  @Post()
  @ApiOperation({
    summary: 'Append immutable audit event',
    description:
      'Field app and agents can record declaration snapshots, device metadata, and other events into the central audit_log.',
  })
  async create(@Body() dto: CreateAuditEventDto, @Req() req: any) {
    this.requireTenantClaim(req);
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'farmer' && role !== 'agent' && role !== 'exporter') {
      throw new ForbiddenException('Only farmers, agents, or exporters can append audit events');
    }
    if (!dto.eventType?.trim() || typeof dto.payload !== 'object' || dto.payload === null) {
      throw new BadRequestException('eventType and payload are required');
    }
    const userId = req.user?.id as string | undefined;
    try {
      const res = await this.pool.query(
        `
          INSERT INTO audit_log (user_id, device_id, event_type, payload)
          VALUES ($1, $2, $3, $4::jsonb)
          RETURNING id, timestamp
        `,
        [
          userId ?? null,
          dto.deviceId?.trim() || null,
          dto.eventType.trim(),
          JSON.stringify(dto.payload),
        ],
      );
      return res.rows[0] ?? { ok: true };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        throw new BadRequestException('audit_log table is not available on this server');
      }
      throw e;
    }
  }

  @Get()
  @ApiQuery({ name: 'farmerId', required: false })
  async list(@Query('farmerId') farmerId: string | undefined, @Req() req: any) {
    this.requireTenantClaim(req);
    const query = (params?: string[]) => {
      if (params) {
        return this.pool.query(
          `
            SELECT id, timestamp, user_id, device_id, event_type, payload
            FROM audit_log
            WHERE payload ->> 'farmerId' = $1
            ORDER BY timestamp DESC
            LIMIT 100
          `,
          params,
        );
      }

      return this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          ORDER BY timestamp DESC
          LIMIT 100
        `,
      );
    };

    try {
      if (farmerId) {
        const res = await query([farmerId]);
        return res.rows;
      }

      const res = await query();
      return res.rows;
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Early in development the DB may not have the audit table yet.
      if (err?.code === '42P01') {
        return [];
      }
      throw e;
    }
  }

  @Get('gated-entry')
  @ApiQuery({ name: 'gate', required: false, enum: ['request_campaigns', 'annual_reporting'] })
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({ name: 'phase', required: false, enum: ['requested', 'succeeded', 'failed'] })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'active', 'completed', 'cancelled'] })
  @ApiOperation({
    summary: 'List dashboard gated-entry telemetry for current tenant',
    description:
      'Returns recent dashboard deferred-route redirect telemetry (`dashboard_gated_entry_attempt`) for the signed tenant claim.',
  })
  async listGatedEntry(
    @Query('gate') gate: 'request_campaigns' | 'annual_reporting' | undefined,
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort, gate: validatedGate } = this.parseGatedEntryFilters(req, gate, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 50;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }

    const params: Array<string | number> = [tenantId, fromHours];
    const gateClause = validatedGate ? ` AND payload ->> 'gate' = $3` : '';
    if (validatedGate) params.push(validatedGate);

    try {
      const countQuery = `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type = 'dashboard_gated_entry_attempt'
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${gateClause}
      `;
      const countRes = await this.pool.query<{ total: number }>(countQuery, params);

      const listParams = [...params, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type = 'dashboard_gated_entry_attempt'
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${gateClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/assignment-exports/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({ name: 'phase', required: false, enum: ['requested', 'succeeded', 'failed'] })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'active', 'completed', 'cancelled'] })
  @ApiOperation({
    summary: 'Export assignment CSV export activity as CSV for current tenant',
    description:
      'Returns tenant-scoped assignment export telemetry (`plot_assignment_export_*`) as CSV with optional phase/status filters.',
  })
  async exportAssignmentExportsCsv(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase') phaseRaw: 'requested' | 'succeeded' | 'failed' | undefined,
    @Query('status') statusRaw: 'all' | 'active' | 'completed' | 'cancelled' | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const phase =
      phaseRaw === 'requested' || phaseRaw === 'succeeded' || phaseRaw === 'failed'
        ? phaseRaw
        : null;
    const status =
      statusRaw === 'active' || statusRaw === 'completed' || statusRaw === 'cancelled' || statusRaw === 'all'
        ? statusRaw
        : null;

    const limit = 5000;
    const params: Array<string | number> = [tenantId, fromHours];
    let phaseClause = '';
    let statusClause = '';
    if (phase) {
      params.push(`plot_assignment_export_${phase}`);
      phaseClause = ` AND event_type = $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      statusClause = ` AND payload ->> 'status' = $${params.length}`;
    }

    try {
      const listRes = await this.pool.query<{
        timestamp: string;
        user_id: string | null;
        event_type: string;
        payload: {
          exportedBy?: string;
          status?: string;
          fromDays?: number;
          agentUserId?: string | null;
          rowCount?: number | null;
          error?: string | null;
        };
      }>(
        `
          SELECT timestamp, user_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'plot_assignment_export_requested',
            'plot_assignment_export_succeeded',
            'plot_assignment_export_failed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseClause}
            ${statusClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT ${limit}
        `,
        params,
      );
      const escapeCsv = (value: string) =>
        value.includes('"') || value.includes(',') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      const lines = [
        'captured_at,actor,phase,status,from_days,agent_user_id,row_count,error',
        ...listRes.rows.map((row) => {
          const capturedAt = row.timestamp ? new Date(row.timestamp).toISOString() : '';
          const actor = row.payload?.exportedBy ?? (row.user_id ? `user:${row.user_id}` : 'unknown');
          const phaseValue = row.event_type.replace('plot_assignment_export_', '');
          const statusValue = row.payload?.status ?? '';
          const fromDaysValue = String(row.payload?.fromDays ?? '');
          const agentUserIdValue = row.payload?.agentUserId ?? '';
          const rowCountValue = String(row.payload?.rowCount ?? '');
          const errorValue = row.payload?.error ?? '';
          return [capturedAt, actor, phaseValue, statusValue, fromDaysValue, agentUserIdValue, rowCountValue, errorValue]
            .map((item) => escapeCsv(item))
            .join(',');
        }),
      ];
      const rowCount = listRes.rows.length;
      const truncated = rowCount >= limit;
      response.setHeader('X-Export-Row-Limit', String(limit));
      response.setHeader('X-Export-Row-Count', String(rowCount));
      response.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
      return lines.join('\n');
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        response.setHeader('X-Export-Row-Limit', String(limit));
        response.setHeader('X-Export-Row-Count', '0');
        response.setHeader('X-Export-Truncated', 'false');
        return 'captured_at,actor,phase,status,from_days,agent_user_id,row_count,error';
      }
      throw e;
    }
  }

  @Get('gated-entry/exports')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiOperation({
    summary: 'List gated-entry CSV export activity for current tenant',
    description:
      'Returns tenant-scoped CSV export activity events (`dashboard_gated_entry_exported`) used for diagnostics/evidence traceability.',
  })
  async listGatedEntryExports(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }

    try {
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type = 'dashboard_gated_entry_exported'
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
        `,
        [tenantId, fromHours],
      );
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type = 'dashboard_gated_entry_exported'
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $3
          OFFSET $4
        `,
        [tenantId, fromHours, limit, offset],
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/assignment-exports')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiOperation({
    summary: 'List assignment CSV export activity for current tenant',
    description:
      'Returns tenant-scoped assignment CSV export telemetry events (`plot_assignment_export_*`) used for operational evidence and diagnostics.',
  })
  async listAssignmentExports(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase') phaseRaw: 'requested' | 'succeeded' | 'failed' | undefined,
    @Query('status') statusRaw: 'all' | 'active' | 'completed' | 'cancelled' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }
    const phase =
      phaseRaw === 'requested' || phaseRaw === 'succeeded' || phaseRaw === 'failed'
        ? phaseRaw
        : null;
    const status =
      statusRaw === 'active' || statusRaw === 'completed' || statusRaw === 'cancelled' || statusRaw === 'all'
        ? statusRaw
        : null;

    try {
      const filtersParams: Array<string> = [];
      let phaseCountClause = '';
      let statusCountClause = '';
      let phaseListClause = '';
      let statusListClause = '';
      if (phase) {
        filtersParams.push(`plot_assignment_export_${phase}`);
        phaseCountClause = ` AND event_type = $${3 + filtersParams.length - 1}`;
        phaseListClause = ` AND event_type = $${3 + filtersParams.length - 1}`;
      }
      if (status && status !== 'all') {
        filtersParams.push(status);
        const statusIndex = 3 + filtersParams.length - 1;
        statusCountClause = ` AND payload ->> 'status' = $${statusIndex}`;
        statusListClause = ` AND payload ->> 'status' = $${statusIndex}`;
      }
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type IN (
            'plot_assignment_export_requested',
            'plot_assignment_export_succeeded',
            'plot_assignment_export_failed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseCountClause}
            ${statusCountClause}
        `,
        [tenantId, fromHours, ...filtersParams],
      );
      const listParams: Array<string | number> = [tenantId, fromHours, ...filtersParams, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'plot_assignment_export_requested',
            'plot_assignment_export_succeeded',
            'plot_assignment_export_failed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseListClause}
            ${statusListClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/risk-scores')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({ name: 'phase', required: false, enum: ['requested', 'evaluated', 'low', 'medium', 'high'] })
  @ApiQuery({ name: 'band', required: false, enum: ['all', 'low', 'medium', 'high'] })
  @ApiOperation({
    summary: 'List package risk-score activity for current tenant',
    description:
      'Returns tenant-scoped package risk score telemetry (`dds_package_risk_score_*`) used for operational diagnostics and evidence review.',
  })
  async listRiskScoreActivity(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase') phaseRaw: 'requested' | 'evaluated' | 'low' | 'medium' | 'high' | undefined,
    @Query('band') bandRaw: 'all' | 'low' | 'medium' | 'high' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }

    const phase =
      phaseRaw === 'requested' ||
      phaseRaw === 'evaluated' ||
      phaseRaw === 'low' ||
      phaseRaw === 'medium' ||
      phaseRaw === 'high'
        ? phaseRaw
        : null;
    const band = bandRaw === 'low' || bandRaw === 'medium' || bandRaw === 'high' || bandRaw === 'all' ? bandRaw : null;

    try {
      const filterParams: Array<string> = [];
      let phaseCountClause = '';
      let bandCountClause = '';
      let phaseListClause = '';
      let bandListClause = '';

      if (phase) {
        filterParams.push(`dds_package_risk_score_${phase}`);
        phaseCountClause = ` AND event_type = $${3 + filterParams.length - 1}`;
        phaseListClause = ` AND event_type = $${3 + filterParams.length - 1}`;
      }
      if (band && band !== 'all') {
        filterParams.push(band);
        const bandIndex = 3 + filterParams.length - 1;
        bandCountClause = ` AND payload ->> 'band' = $${bandIndex}`;
        bandListClause = ` AND payload ->> 'band' = $${bandIndex}`;
      }

      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type IN (
            'dds_package_risk_score_requested',
            'dds_package_risk_score_evaluated',
            'dds_package_risk_score_low',
            'dds_package_risk_score_medium',
            'dds_package_risk_score_high'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseCountClause}
            ${bandCountClause}
        `,
        [tenantId, fromHours, ...filterParams],
      );
      const listParams: Array<string | number> = [tenantId, fromHours, ...filterParams, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'dds_package_risk_score_requested',
            'dds_package_risk_score_evaluated',
            'dds_package_risk_score_low',
            'dds_package_risk_score_medium',
            'dds_package_risk_score_high'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseListClause}
            ${bandListClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/risk-scores/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({ name: 'phase', required: false, enum: ['requested', 'evaluated', 'low', 'medium', 'high'] })
  @ApiQuery({ name: 'band', required: false, enum: ['all', 'low', 'medium', 'high'] })
  @ApiOperation({
    summary: 'Export risk-score activity as CSV for current tenant',
    description:
      'Returns tenant-scoped risk-score telemetry (`dds_package_risk_score_*`) as CSV with optional phase/band filters.',
  })
  async exportRiskScoreActivityCsv(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase') phaseRaw: 'requested' | 'evaluated' | 'low' | 'medium' | 'high' | undefined,
    @Query('band') bandRaw: 'all' | 'low' | 'medium' | 'high' | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const phase =
      phaseRaw === 'requested' ||
      phaseRaw === 'evaluated' ||
      phaseRaw === 'low' ||
      phaseRaw === 'medium' ||
      phaseRaw === 'high'
        ? phaseRaw
        : null;
    const band = bandRaw === 'low' || bandRaw === 'medium' || bandRaw === 'high' || bandRaw === 'all' ? bandRaw : null;

    const limit = 5000;
    const params: Array<string | number> = [tenantId, fromHours];
    let phaseClause = '';
    let bandClause = '';
    if (phase) {
      params.push(`dds_package_risk_score_${phase}`);
      phaseClause = ` AND event_type = $${params.length}`;
    }
    if (band && band !== 'all') {
      params.push(band);
      bandClause = ` AND payload ->> 'band' = $${params.length}`;
    }

    try {
      const listRes = await this.pool.query<{
        timestamp: string;
        user_id: string | null;
        event_type: string;
        payload: {
          exportedBy?: string | null;
          packageId?: string;
          provider?: string | null;
          score?: number | null;
          band?: string | null;
          reasonCount?: number | null;
          scoredAt?: string | null;
        };
      }>(
        `
          SELECT timestamp, user_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'dds_package_risk_score_requested',
            'dds_package_risk_score_evaluated',
            'dds_package_risk_score_low',
            'dds_package_risk_score_medium',
            'dds_package_risk_score_high'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseClause}
            ${bandClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT ${limit}
        `,
        params,
      );
      const escapeCsv = (value: string) =>
        value.includes('"') || value.includes(',') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      const lines = [
        'captured_at,actor,phase,package_id,provider,band,score,reason_count,scored_at',
        ...listRes.rows.map((row) => {
          const capturedAt = row.timestamp ? new Date(row.timestamp).toISOString() : '';
          const actor = row.payload?.exportedBy ?? (row.user_id ? `user:${row.user_id}` : 'unknown');
          const phaseValue = row.event_type.replace('dds_package_risk_score_', '');
          const packageId = row.payload?.packageId ?? '';
          const provider = row.payload?.provider ?? '';
          const bandValue = row.payload?.band ?? '';
          const score = String(row.payload?.score ?? '');
          const reasonCount = String(row.payload?.reasonCount ?? '');
          const scoredAt = row.payload?.scoredAt ?? '';
          return [capturedAt, actor, phaseValue, packageId, provider, bandValue, score, reasonCount, scoredAt]
            .map((item) => escapeCsv(item))
            .join(',');
        }),
      ];
      const rowCount = listRes.rows.length;
      const truncated = rowCount >= limit;
      response.setHeader('X-Export-Row-Limit', String(limit));
      response.setHeader('X-Export-Row-Count', String(rowCount));
      response.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
      return lines.join('\n');
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        response.setHeader('X-Export-Row-Limit', String(limit));
        response.setHeader('X-Export-Row-Count', '0');
        response.setHeader('X-Export-Truncated', 'false');
        return 'captured_at,actor,phase,package_id,provider,band,score,reason_count,scored_at';
      }
      throw e;
    }
  }

  @Get('gated-entry/filing-activity')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({
    name: 'phase',
    required: false,
    enum: ['generation_requested', 'generation_generated', 'submission_requested', 'submission_accepted', 'submission_replayed'],
  })
  @ApiOperation({
    summary: 'List filing lifecycle activity for current tenant',
    description:
      'Returns tenant-scoped filing lifecycle telemetry (`dds_package_generation_*`, `dds_package_submission_*`) for diagnostics and release evidence.',
  })
  async listFilingActivity(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase')
    phaseRaw:
      | 'generation_requested'
      | 'generation_generated'
      | 'submission_requested'
      | 'submission_accepted'
      | 'submission_replayed'
      | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }
    const phaseMap: Record<string, string> = {
      generation_requested: 'dds_package_generation_requested',
      generation_generated: 'dds_package_generation_generated',
      submission_requested: 'dds_package_submission_requested',
      submission_accepted: 'dds_package_submission_accepted',
      submission_replayed: 'dds_package_submission_replayed',
    };
    const normalizedPhase = phaseRaw && phaseMap[phaseRaw] ? phaseRaw : null;
    try {
      const filterParams: Array<string> = [];
      let phaseCountClause = '';
      let phaseListClause = '';
      if (normalizedPhase) {
        filterParams.push(phaseMap[normalizedPhase]);
        phaseCountClause = ` AND event_type = $${3 + filterParams.length - 1}`;
        phaseListClause = ` AND event_type = $${3 + filterParams.length - 1}`;
      }
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type IN (
            'dds_package_generation_requested',
            'dds_package_generation_generated',
            'dds_package_submission_requested',
            'dds_package_submission_accepted',
            'dds_package_submission_replayed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseCountClause}
        `,
        [tenantId, fromHours, ...filterParams],
      );
      const listParams: Array<string | number> = [tenantId, fromHours, ...filterParams, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'dds_package_generation_requested',
            'dds_package_generation_generated',
            'dds_package_submission_requested',
            'dds_package_submission_accepted',
            'dds_package_submission_replayed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseListClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/filing-activity/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({
    name: 'phase',
    required: false,
    enum: ['generation_requested', 'generation_generated', 'submission_requested', 'submission_accepted', 'submission_replayed'],
  })
  @ApiOperation({
    summary: 'Export filing lifecycle activity as CSV for current tenant',
    description:
      'Returns tenant-scoped filing lifecycle telemetry as CSV with optional phase filter.',
  })
  async exportFilingActivityCsv(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase')
    phaseRaw:
      | 'generation_requested'
      | 'generation_generated'
      | 'submission_requested'
      | 'submission_accepted'
      | 'submission_replayed'
      | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const phaseMap: Record<string, string> = {
      generation_requested: 'dds_package_generation_requested',
      generation_generated: 'dds_package_generation_generated',
      submission_requested: 'dds_package_submission_requested',
      submission_accepted: 'dds_package_submission_accepted',
      submission_replayed: 'dds_package_submission_replayed',
    };
    const normalizedPhase = phaseRaw && phaseMap[phaseRaw] ? phaseRaw : null;
    const limit = 5000;
    const params: Array<string | number> = [tenantId, fromHours];
    let phaseClause = '';
    if (normalizedPhase) {
      params.push(phaseMap[normalizedPhase]);
      phaseClause = ` AND event_type = $${params.length}`;
    }
    try {
      const listRes = await this.pool.query<{
        timestamp: string;
        user_id: string | null;
        event_type: string;
        payload: {
          exportedBy?: string | null;
          packageId?: string;
          status?: string | null;
          artifactVersion?: string | null;
          lotCount?: number | null;
          generatedAt?: string | null;
          idempotencyKey?: string | null;
          submissionState?: string | null;
          tracesReference?: string | null;
          replayed?: boolean | null;
          persistedAt?: string | null;
        };
      }>(
        `
          SELECT timestamp, user_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'dds_package_generation_requested',
            'dds_package_generation_generated',
            'dds_package_submission_requested',
            'dds_package_submission_accepted',
            'dds_package_submission_replayed'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT ${limit}
        `,
        params,
      );
      const escapeCsv = (value: string) =>
        value.includes('"') || value.includes(',') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      const lines = [
        'captured_at,actor,phase,package_id,status,artifact_version,lot_count,idempotency_key,submission_state,traces_reference,replayed,persisted_at,generated_at',
        ...listRes.rows.map((row) => {
          const capturedAt = row.timestamp ? new Date(row.timestamp).toISOString() : '';
          const actor = row.payload?.exportedBy ?? (row.user_id ? `user:${row.user_id}` : 'unknown');
          const phaseValue = row.event_type
            .replace('dds_package_generation_', 'generation_')
            .replace('dds_package_submission_', 'submission_');
          return [
            capturedAt,
            actor,
            phaseValue,
            row.payload?.packageId ?? '',
            row.payload?.status ?? '',
            row.payload?.artifactVersion ?? '',
            String(row.payload?.lotCount ?? ''),
            row.payload?.idempotencyKey ?? '',
            row.payload?.submissionState ?? '',
            row.payload?.tracesReference ?? '',
            String(row.payload?.replayed ?? ''),
            row.payload?.persistedAt ?? '',
            row.payload?.generatedAt ?? '',
          ]
            .map((item) => escapeCsv(item))
            .join(',');
        }),
      ];
      const rowCount = listRes.rows.length;
      const truncated = rowCount >= limit;
      response.setHeader('X-Export-Row-Limit', String(limit));
      response.setHeader('X-Export-Row-Count', String(rowCount));
      response.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
      return lines.join('\n');
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        response.setHeader('X-Export-Row-Limit', String(limit));
        response.setHeader('X-Export-Row-Count', '0');
        response.setHeader('X-Export-Truncated', 'false');
        return 'captured_at,actor,phase,package_id,status,artifact_version,lot_count,idempotency_key,submission_state,traces_reference,replayed,persisted_at,generated_at';
      }
      throw e;
    }
  }

  @Get('gated-entry/chat-threads')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({ name: 'phase', required: false, enum: ['created', 'posted', 'replayed', 'resolved', 'reopened', 'archived'] })
  @ApiOperation({
    summary: 'List chat thread activity for current tenant',
    description:
      'Returns tenant-scoped chat-thread telemetry (`chat_thread_created`, `chat_thread_message_posted`, `chat_thread_message_replayed`) for diagnostics.',
  })
  async listChatThreadActivity(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase') phaseRaw: 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }
    const phaseMap: Record<string, string> = {
      created: 'chat_thread_created',
      posted: 'chat_thread_message_posted',
      replayed: 'chat_thread_message_replayed',
      resolved: 'chat_thread_resolved',
      reopened: 'chat_thread_reopened',
      archived: 'chat_thread_archived',
    };
    const normalizedPhase = phaseRaw && phaseMap[phaseRaw] ? phaseRaw : null;
    try {
      const filterParams: Array<string> = [];
      let phaseCountClause = '';
      let phaseListClause = '';
      if (normalizedPhase) {
        filterParams.push(phaseMap[normalizedPhase]);
        phaseCountClause = ` AND event_type = $${3 + filterParams.length - 1}`;
        phaseListClause = ` AND event_type = $${3 + filterParams.length - 1}`;
      }
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type IN (
            'chat_thread_created',
            'chat_thread_message_posted',
            'chat_thread_message_replayed',
            'chat_thread_resolved',
            'chat_thread_reopened',
            'chat_thread_archived'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseCountClause}
        `,
        [tenantId, fromHours, ...filterParams],
      );
      const listParams: Array<string | number> = [tenantId, fromHours, ...filterParams, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'chat_thread_created',
            'chat_thread_message_posted',
            'chat_thread_message_replayed',
            'chat_thread_resolved',
            'chat_thread_reopened',
            'chat_thread_archived'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseListClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/workflow-activity')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1-200)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (>=0)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiQuery({
    name: 'phase',
    required: false,
    enum: ['template_created', 'stage_transitioned', 'sla_warning', 'sla_breached', 'sla_escalated', 'sla_recovered'],
  })
  @ApiQuery({ name: 'slaState', required: false, enum: ['all', 'on_track', 'warning', 'breached', 'escalated'] })
  @ApiOperation({
    summary: 'List workflow template/stage activity for current tenant',
    description:
      'Returns tenant-scoped workflow lifecycle telemetry (`workflow_template_*`, `workflow_stage_*`) for operator diagnostics and SLA visibility.',
  })
  async listWorkflowActivity(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @Query('offset') offsetRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Query('phase')
    phaseRaw:
      | 'template_created'
      | 'stage_transitioned'
      | 'sla_warning'
      | 'sla_breached'
      | 'sla_escalated'
      | 'sla_recovered'
      | undefined,
    @Query('slaState') slaStateRaw: 'all' | 'on_track' | 'warning' | 'breached' | 'escalated' | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, sortRaw);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const offset = offsetRaw ? Number(offsetRaw) : 0;
    if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200.');
    }
    if (!Number.isFinite(offset) || offset < 0) {
      throw new BadRequestException('offset must be >= 0.');
    }
    const phaseMap: Record<string, string> = {
      template_created: 'workflow_template_created',
      stage_transitioned: 'workflow_stage_transitioned',
      sla_warning: 'workflow_stage_sla_warning',
      sla_breached: 'workflow_stage_sla_breached',
      sla_escalated: 'workflow_stage_sla_escalated',
      sla_recovered: 'workflow_stage_sla_recovered',
    };
    const normalizedPhase = phaseRaw && phaseMap[phaseRaw] ? phaseRaw : null;
    const slaState =
      slaStateRaw === 'all' ||
      slaStateRaw === 'on_track' ||
      slaStateRaw === 'warning' ||
      slaStateRaw === 'breached' ||
      slaStateRaw === 'escalated'
        ? slaStateRaw
        : null;
    try {
      const filterParams: Array<string> = [];
      let phaseCountClause = '';
      let slaCountClause = '';
      let phaseListClause = '';
      let slaListClause = '';
      if (normalizedPhase) {
        filterParams.push(phaseMap[normalizedPhase]);
        phaseCountClause = ` AND event_type = $${3 + filterParams.length - 1}`;
        phaseListClause = ` AND event_type = $${3 + filterParams.length - 1}`;
      }
      if (slaState && slaState !== 'all') {
        filterParams.push(slaState);
        const slaStateIndex = 3 + filterParams.length - 1;
        slaCountClause = ` AND payload ->> 'slaState' = $${slaStateIndex}`;
        slaListClause = ` AND payload ->> 'slaState' = $${slaStateIndex}`;
      }
      const countRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM audit_log
          WHERE event_type IN (
            'workflow_template_created',
            'workflow_stage_transitioned',
            'workflow_stage_sla_warning',
            'workflow_stage_sla_breached',
            'workflow_stage_sla_escalated',
            'workflow_stage_sla_recovered'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseCountClause}
            ${slaCountClause}
        `,
        [tenantId, fromHours, ...filterParams],
      );
      const listParams: Array<string | number> = [tenantId, fromHours, ...filterParams, limit, offset];
      const listRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE event_type IN (
            'workflow_template_created',
            'workflow_stage_transitioned',
            'workflow_stage_sla_warning',
            'workflow_stage_sla_breached',
            'workflow_stage_sla_escalated',
            'workflow_stage_sla_recovered'
          )
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${phaseListClause}
            ${slaListClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT $${listParams.length - 1}
          OFFSET $${listParams.length}
        `,
        listParams,
      );
      return {
        items: listRes.rows,
        total: Number(countRes.rows[0]?.total ?? 0),
        limit,
        offset,
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { items: [], total: 0, limit, offset };
      }
      throw e;
    }
  }

  @Get('gated-entry/dashboard-summary')
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiOperation({
    summary: 'Get dashboard diagnostics summary for current tenant',
    description:
      'Returns tenant-scoped aggregate counters across gated-entry, assignment export, risk, filing, and chat diagnostics event families.',
  })
  async getDashboardDiagnosticsSummary(
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Req() req: any,
  ) {
    const { tenantId, fromHours } = this.parseGatedEntryFilters(req, undefined, fromHoursRaw, undefined);
    try {
      const summaryRes = await this.pool.query<{
        gated_entry_attempts: number;
        assignment_export_events: number;
        assignment_export_requested: number;
        assignment_export_succeeded: number;
        assignment_export_failed: number;
        assignment_status_active: number;
        assignment_status_completed: number;
        assignment_status_cancelled: number;
        risk_score_events: number;
        risk_band_low: number;
        risk_band_medium: number;
        risk_band_high: number;
        filing_activity_events: number;
        filing_generation_events: number;
        filing_submission_events: number;
        chat_activity_events: number;
        chat_created_events: number;
        chat_posted_events: number;
        chat_replayed_events: number;
        chat_resolved_events: number;
        chat_reopened_events: number;
        chat_archived_events: number;
        latest_event_at: string | null;
      }>(
        `
          SELECT
            COUNT(*) FILTER (
              WHERE event_type = 'dashboard_gated_entry_attempt'
            )::int AS gated_entry_attempts,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'plot_assignment_export_requested',
                'plot_assignment_export_succeeded',
                'plot_assignment_export_failed'
              )
            )::int AS assignment_export_events,
            COUNT(*) FILTER (
              WHERE event_type = 'plot_assignment_export_requested'
            )::int AS assignment_export_requested,
            COUNT(*) FILTER (
              WHERE event_type = 'plot_assignment_export_succeeded'
            )::int AS assignment_export_succeeded,
            COUNT(*) FILTER (
              WHERE event_type = 'plot_assignment_export_failed'
            )::int AS assignment_export_failed,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'plot_assignment_export_requested',
                'plot_assignment_export_succeeded',
                'plot_assignment_export_failed'
              )
                AND payload ->> 'status' = 'active'
            )::int AS assignment_status_active,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'plot_assignment_export_requested',
                'plot_assignment_export_succeeded',
                'plot_assignment_export_failed'
              )
                AND payload ->> 'status' = 'completed'
            )::int AS assignment_status_completed,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'plot_assignment_export_requested',
                'plot_assignment_export_succeeded',
                'plot_assignment_export_failed'
              )
                AND payload ->> 'status' = 'cancelled'
            )::int AS assignment_status_cancelled,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'dds_package_risk_score_requested',
                'dds_package_risk_score_evaluated',
                'dds_package_risk_score_low',
                'dds_package_risk_score_medium',
                'dds_package_risk_score_high'
              )
            )::int AS risk_score_events,
            COUNT(*) FILTER (
              WHERE event_type = 'dds_package_risk_score_low'
            )::int AS risk_band_low,
            COUNT(*) FILTER (
              WHERE event_type = 'dds_package_risk_score_medium'
            )::int AS risk_band_medium,
            COUNT(*) FILTER (
              WHERE event_type = 'dds_package_risk_score_high'
            )::int AS risk_band_high,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'dds_package_generation_requested',
                'dds_package_generation_generated',
                'dds_package_submission_requested',
                'dds_package_submission_accepted',
                'dds_package_submission_replayed'
              )
            )::int AS filing_activity_events,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'dds_package_generation_requested',
                'dds_package_generation_generated'
              )
            )::int AS filing_generation_events,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'dds_package_submission_requested',
                'dds_package_submission_accepted',
                'dds_package_submission_replayed'
              )
            )::int AS filing_submission_events,
            COUNT(*) FILTER (
              WHERE event_type IN (
                'chat_thread_created',
                'chat_thread_message_posted',
                'chat_thread_message_replayed',
                'chat_thread_resolved',
                'chat_thread_reopened',
                'chat_thread_archived'
              )
            )::int AS chat_activity_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_created'
            )::int AS chat_created_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_message_posted'
            )::int AS chat_posted_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_message_replayed'
            )::int AS chat_replayed_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_resolved'
            )::int AS chat_resolved_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_reopened'
            )::int AS chat_reopened_events,
            COUNT(*) FILTER (
              WHERE event_type = 'chat_thread_archived'
            )::int AS chat_archived_events,
            MAX(timestamp)::text AS latest_event_at
          FROM audit_log
          WHERE payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
        `,
        [tenantId, fromHours],
      );
      const row = summaryRes.rows[0] ?? {
        gated_entry_attempts: 0,
        assignment_export_events: 0,
        assignment_export_requested: 0,
        assignment_export_succeeded: 0,
        assignment_export_failed: 0,
        assignment_status_active: 0,
        assignment_status_completed: 0,
        assignment_status_cancelled: 0,
        risk_score_events: 0,
        risk_band_low: 0,
        risk_band_medium: 0,
        risk_band_high: 0,
        filing_activity_events: 0,
        filing_generation_events: 0,
        filing_submission_events: 0,
        chat_activity_events: 0,
        chat_created_events: 0,
        chat_posted_events: 0,
        chat_replayed_events: 0,
        chat_resolved_events: 0,
        chat_reopened_events: 0,
        chat_archived_events: 0,
        latest_event_at: null,
      };
      const totalDiagnostics =
        Number(row.gated_entry_attempts ?? 0) +
        Number(row.assignment_export_events ?? 0) +
        Number(row.risk_score_events ?? 0) +
        Number(row.filing_activity_events ?? 0) +
        Number(row.chat_activity_events ?? 0);
      return {
        tenantId,
        fromHours,
        totalDiagnostics,
        counters: {
          gatedEntryAttempts: Number(row.gated_entry_attempts ?? 0),
          assignmentExportEvents: Number(row.assignment_export_events ?? 0),
          riskScoreEvents: Number(row.risk_score_events ?? 0),
          filingActivityEvents: Number(row.filing_activity_events ?? 0),
          chatActivityEvents: Number(row.chat_activity_events ?? 0),
        },
        breakdown: {
          assignmentPhase: {
            requested: Number(row.assignment_export_requested ?? 0),
            succeeded: Number(row.assignment_export_succeeded ?? 0),
            failed: Number(row.assignment_export_failed ?? 0),
          },
          assignmentStatus: {
            active: Number(row.assignment_status_active ?? 0),
            completed: Number(row.assignment_status_completed ?? 0),
            cancelled: Number(row.assignment_status_cancelled ?? 0),
          },
          riskBand: {
            low: Number(row.risk_band_low ?? 0),
            medium: Number(row.risk_band_medium ?? 0),
            high: Number(row.risk_band_high ?? 0),
          },
          filingFamily: {
            generation: Number(row.filing_generation_events ?? 0),
            submission: Number(row.filing_submission_events ?? 0),
          },
          chatPhase: {
            created: Number(row.chat_created_events ?? 0),
            posted: Number(row.chat_posted_events ?? 0),
            replayed: Number(row.chat_replayed_events ?? 0),
            resolved: Number(row.chat_resolved_events ?? 0),
            reopened: Number(row.chat_reopened_events ?? 0),
            archived: Number(row.chat_archived_events ?? 0),
          },
        },
        readiness: {
          hasAnyDiagnostics: totalDiagnostics > 0,
          canExportDetailed: totalDiagnostics > 0,
          latestEventAt: row.latest_event_at,
        },
      };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return {
          tenantId,
          fromHours,
          totalDiagnostics: 0,
          counters: {
            gatedEntryAttempts: 0,
            assignmentExportEvents: 0,
            riskScoreEvents: 0,
            filingActivityEvents: 0,
            chatActivityEvents: 0,
          },
          breakdown: {
            assignmentPhase: { requested: 0, succeeded: 0, failed: 0 },
            assignmentStatus: { active: 0, completed: 0, cancelled: 0 },
            riskBand: { low: 0, medium: 0, high: 0 },
            filingFamily: { generation: 0, submission: 0 },
            chatPhase: { created: 0, posted: 0, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
          },
          readiness: {
            hasAnyDiagnostics: false,
            canExportDetailed: false,
            latestEventAt: null,
          },
        };
      }
      throw e;
    }
  }

  @Get('gated-entry/actors')
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated user_id list (max 50)' })
  @ApiOperation({
    summary: 'Resolve gated-entry export actor labels by user ids',
    description:
      'Returns tenant-scoped actor labels for export events so dashboard diagnostics can resolve actor identities without local directory coupling.',
  })
  async resolveGatedEntryActors(
    @Query('ids') idsRaw: string | undefined,
    @Req() req: any,
  ) {
    const tenantId = this.getTenantClaim(req);
    const ids = Array.from(
      new Set(
        (idsRaw ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 50),
      ),
    );
    if (ids.length === 0) {
      throw new BadRequestException('ids is required.');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (ids.some((id) => !uuidRegex.test(id))) {
      throw new BadRequestException('ids must be UUID values.');
    }

    try {
      const res = await this.pool.query<{
        user_id: string | null;
        exported_by: string | null;
        user_name: string | null;
      }>(
        `
          SELECT
            a.user_id,
            a.payload ->> 'exportedBy' AS exported_by,
            ua.name AS user_name
          FROM audit_log a
          LEFT JOIN user_account ua
            ON ua.id = a.user_id
          WHERE a.event_type = 'dashboard_gated_entry_exported'
            AND a.payload ->> 'tenantId' = $1
            AND a.user_id = ANY($2::uuid[])
          ORDER BY timestamp DESC
          LIMIT 500
        `,
        [tenantId, ids],
      );

      const actors: Record<string, string> = {};
      for (const row of res.rows) {
        if (!row.user_id || actors[row.user_id]) continue;
        const exportedBy = row.exported_by?.trim();
        if (exportedBy && exportedBy.length > 0) {
          actors[row.user_id] = exportedBy;
          continue;
        }
        const userName = row.user_name?.trim();
        actors[row.user_id] = userName && userName.length > 0 ? userName : `user:${row.user_id}`;
      }
      ids.forEach((id) => {
        if (!actors[id]) actors[id] = `user:${id}`;
      });
      return { actors };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        return { actors: Object.fromEntries(ids.map((id) => [id, `user:${id}`])) };
      }
      throw e;
    }
  }

  @Get('gated-entry/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiQuery({ name: 'gate', required: false, enum: ['request_campaigns', 'annual_reporting'] })
  @ApiQuery({ name: 'fromHours', required: false, type: Number, description: 'Lookback window in hours (1-720)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['desc', 'asc'], description: 'Timestamp sort order' })
  @ApiOperation({
    summary: 'Export dashboard gated-entry telemetry as CSV for current tenant',
    description:
      'Returns tenant-scoped deferred-route telemetry in CSV format for operational handoff and release evidence capture.',
  })
  async exportGatedEntryCsv(
    @Query('gate') gate: 'request_campaigns' | 'annual_reporting' | undefined,
    @Query('fromHours') fromHoursRaw: string | undefined,
    @Query('sort') sortRaw: 'desc' | 'asc' | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { tenantId, fromHours, sort } = this.parseGatedEntryFilters(req, gate, fromHoursRaw, sortRaw);
    const params: Array<string | number> = [tenantId, fromHours];
    const gateClause = gate ? ` AND payload ->> 'gate' = $3` : '';
    if (gate) params.push(gate);
    const limit = 5000;

    try {
      const listRes = await this.pool.query<{
        timestamp: string;
        payload: {
          gate?: string;
          role?: string;
          feature?: string;
          redirectedPath?: string;
        };
      }>(
        `
          SELECT timestamp, payload
          FROM audit_log
          WHERE event_type = 'dashboard_gated_entry_attempt'
            AND payload ->> 'tenantId' = $1
            AND timestamp >= (NOW() - (($2::int || ' hours')::interval))
            ${gateClause}
          ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}
          LIMIT ${limit}
        `,
        params,
      );

      const lines = [
        'captured_at,gate,role,feature,redirected_path',
        ...listRes.rows.map((row) => {
          const escapeCsv = (value: string) =>
            value.includes('"') || value.includes(',') || value.includes('\n')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          const capturedAt = row.timestamp ? new Date(row.timestamp).toISOString() : '';
          const gateValue = row.payload?.gate ?? '';
          const roleValue = row.payload?.role ?? '';
          const featureValue = row.payload?.feature ?? '';
          const redirectedPath = row.payload?.redirectedPath ?? '/';
          return [capturedAt, gateValue, roleValue, featureValue, redirectedPath]
            .map((item) => escapeCsv(item))
            .join(',');
        }),
      ];
      const rowCount = listRes.rows.length;
      const truncated = rowCount >= limit;
      await this.appendGatedEntryExportAuditEvent({
        userId: (req?.user?.id as string | undefined) ?? null,
        exportedBy:
          (req?.user?.email as string | undefined) ??
          (req?.user?.id ? `user:${String(req.user.id)}` : null),
        tenantId,
        gate,
        fromHours,
        sort,
        rowCount,
        rowLimit: limit,
        truncated,
      });
      response.setHeader('X-Export-Row-Limit', String(limit));
      response.setHeader('X-Export-Row-Count', String(rowCount));
      response.setHeader('X-Export-Truncated', truncated ? 'true' : 'false');
      return lines.join('\n');
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === '42P01') {
        response.setHeader('X-Export-Row-Limit', String(limit));
        response.setHeader('X-Export-Row-Count', '0');
        response.setHeader('X-Export-Truncated', 'false');
        return 'captured_at,gate,role,feature,redirected_path';
      }
      throw e;
    }
  }
}

