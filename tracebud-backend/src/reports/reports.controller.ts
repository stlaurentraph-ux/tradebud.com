import { Controller, ForbiddenException, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { deriveRoleFromSupabaseUser } from '../auth/roles';
import { LaunchService } from '../launch/launch.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/reports')
export class ReportsController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly launchService: LaunchService,
  ) {}

  private assertExporter(req: any): string {
    const tenantId =
      req?.user?.app_metadata?.tenant_id ??
      req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (role !== 'exporter') {
      throw new ForbiddenException('Only exporters can access reports');
    }
    return tenantId;
  }

  private assertImporterReportingAccess(req: any): string {
    const tenantId = req?.user?.app_metadata?.tenant_id ?? req?.user?.user_metadata?.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim');
    }
    const role = deriveRoleFromSupabaseUser(req.user);
    if (!['compliance_manager', 'admin', 'exporter'].includes(role)) {
      throw new ForbiddenException('This role cannot access importer reporting summary.');
    }
    return tenantId;
  }

  @Get('importer-summary')
  async importerSummary(@Req() req: any) {
    const tenantId = this.assertImporterReportingAccess(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_reporting');
    try {
      const [campaignsRes, inboxRes] = await Promise.all([
        this.pool.query<{ total: string; completed: string; in_progress: string; blocked: string }>(
          `
          SELECT
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE status = 'COMPLETED')::text AS completed,
            COUNT(*) FILTER (WHERE status IN ('RUNNING', 'PARTIAL', 'QUEUED'))::text AS in_progress,
            COUNT(*) FILTER (WHERE status = 'EXPIRED')::text AS blocked
          FROM request_campaigns
          WHERE tenant_id = $1
        `,
          [tenantId],
        ),
        this.pool.query<{ total: string; responded: string; pending: string; overdue: string }>(
          `
          SELECT
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE status = 'RESPONDED')::text AS responded,
            COUNT(*) FILTER (WHERE status = 'PENDING')::text AS pending,
            COUNT(*) FILTER (WHERE status = 'PENDING' AND due_at < NOW())::text AS overdue
          FROM inbox_requests
          WHERE recipient_tenant_id = $1
        `,
          [tenantId],
        ),
      ]);
      const campaigns = campaignsRes.rows[0] ?? { total: '0', completed: '0', in_progress: '0', blocked: '0' };
      const inbox = inboxRes.rows[0] ?? { total: '0', responded: '0', pending: '0', overdue: '0' };
      return {
        declaration_readiness_rate: Number(campaigns.total) > 0
          ? Math.round((Number(campaigns.completed) / Number(campaigns.total)) * 100)
          : 0,
        compliant_evidence_records: Number(campaigns.completed) + Number(inbox.responded),
        shipments_ytd: Number(campaigns.total),
        reporting_snapshots: Number(campaigns.in_progress),
        readiness_distribution: {
          compliant: Number(campaigns.completed),
          warnings: Number(campaigns.in_progress) + Number(inbox.pending),
          blocked: Number(campaigns.blocked) + Number(inbox.overdue),
        },
      };
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return {
          declaration_readiness_rate: 0,
          compliant_evidence_records: 0,
          shipments_ytd: 0,
          reporting_snapshots: 0,
          readiness_distribution: { compliant: 0, warnings: 0, blocked: 0 },
        };
      }
      throw error;
    }
  }

  @Get('plots')
  @ApiQuery({ name: 'farmerId', required: true })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Set to csv to receive a CSV file instead of JSON',
  })
  async plotsReport(
    @Query('farmerId') farmerId: string,
    @Query('format') format: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const tenantId = this.assertExporter(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_reporting');
    if (format === 'csv') {
      await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    }
    const rowsRes = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          name,
          kind,
          area_ha,
          declared_area_ha,
          sinaph_overlap,
          indigenous_overlap,
          status,
          created_at
        FROM plot
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    const rows = rowsRes.rows;

    if (format === 'csv') {
      const header = [
        'id',
        'farmer_id',
        'name',
        'kind',
        'area_ha',
        'declared_area_ha',
        'sinaph_overlap',
        'indigenous_overlap',
        'status',
        'created_at',
      ];
      const csvLines = [
        header.join(','),
        ...rows.map((r) =>
          [
            r.id,
            r.farmer_id,
            `"${(r.name ?? '').replace(/"/g, '""')}"`,
            r.kind,
            r.area_ha,
            r.declared_area_ha ?? '',
            r.sinaph_overlap,
            r.indigenous_overlap,
            r.status,
            r.created_at.toISOString(),
          ].join(','),
        ),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.send(csvLines.join('\n'));
      return;
    }

    res.json(rows);
  }

  @Get('harvests')
  @ApiQuery({ name: 'farmerId', required: true })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start ISO date (inclusive)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'End ISO date (inclusive)',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Set to csv to receive a CSV file instead of JSON',
  })
  async harvestsReport(
    @Query('farmerId') farmerId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('format') format: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const tenantId = this.assertExporter(req);
    await this.launchService.requireFeatureAccess(tenantId, 'dashboard_reporting');
    if (format === 'csv') {
      await this.launchService.requireFeatureAccess(tenantId, 'dashboard_exports');
    }
    const params: any[] = [farmerId];
    const conditions = ['ht.farmer_id = $1'];

    if (from) {
      params.push(from);
      conditions.push(`ht.harvest_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`ht.harvest_date <= $${params.length}`);
    }

    const rowsRes = await this.pool.query(
      `
        SELECT
          ht.id as harvest_id,
          ht.farmer_id,
          ht.plot_id,
          ht.kg,
          ht.harvest_date,
          v.id as voucher_id,
          v.status as voucher_status,
          v.qr_code_ref,
          p.name as plot_name,
          p.area_ha
        FROM harvest_transaction ht
        JOIN voucher v ON v.transaction_id = ht.id
        JOIN plot p ON p.id = ht.plot_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ht.harvest_date DESC NULLS LAST, ht.created_at DESC
      `,
      params,
    );

    const rows = rowsRes.rows;

    if (format === 'csv') {
      const header = [
        'harvest_id',
        'farmer_id',
        'plot_id',
        'plot_name',
        'area_ha',
        'kg',
        'harvest_date',
        'voucher_id',
        'voucher_status',
        'qr_code_ref',
      ];
      const csvLines = [
        header.join(','),
        ...rows.map((r) =>
          [
            r.harvest_id,
            r.farmer_id,
            r.plot_id,
            `"${(r.plot_name ?? '').replace(/"/g, '""')}"`,
            r.area_ha,
            r.kg,
            r.harvest_date ? new Date(r.harvest_date).toISOString().slice(0, 10) : '',
            r.voucher_id,
            r.voucher_status,
            r.qr_code_ref ?? '',
          ].join(','),
        ),
      ];

      if (res) {
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvLines.join('\n'));
        return;
      }
    }

    if (res) {
      res.json(rows);
    }
  }
}

