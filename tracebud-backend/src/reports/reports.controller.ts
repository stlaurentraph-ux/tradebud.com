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

