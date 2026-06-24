import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BulkPlotImportEvidenceService } from './bulk-plot-import-evidence.service';
import { BulkPlotImportJobService } from './bulk-plot-import-job.service';
import { BulkPlotImportService } from './bulk-plot-import.service';
import type {
  BulkPlotImportEvidenceItemInput,
  BulkPlotImportInputRow,
} from './bulk-plot-import.types';
import {
  BULK_PLOT_IMPORT_EVIDENCE_MAX_BYTES,
  BULK_PLOT_IMPORT_EVIDENCE_MAX_ITEMS,
} from './bulk-plot-import.types';

const BULK_PLOT_IMPORT_ROLES = [
  'cooperative',
  'exporter',
  'admin',
  'compliance_manager',
] as const;

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('v1/imports/plots')
export class BulkPlotImportController {
  constructor(
    private readonly bulkPlotImportService: BulkPlotImportService,
    private readonly bulkPlotImportJobService: BulkPlotImportJobService,
    private readonly bulkPlotImportEvidenceService: BulkPlotImportEvidenceService,
  ) {}

  private getTenantId(req: any): string {
    const tenantId = deriveTenantIdFromSupabaseUser(req?.user);
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant claim in app_metadata');
    }
    return tenantId;
  }

  private assertBulkPlotImportAccess(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    if (!role || !(BULK_PLOT_IMPORT_ROLES as readonly string[]).includes(role)) {
      throw new ForbiddenException('This role cannot bulk-import plots.');
    }
  }

  @Post('preview')
  @ApiOperation({ summary: 'Validate bulk plot import rows without writing data' })
  preview(
    @Req() req: any,
    @Body() body: { rows?: BulkPlotImportInputRow[]; summaryOnly?: boolean },
  ) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    return this.bulkPlotImportService.preview(tenantId, body?.rows ?? [], {
      summaryOnly: body?.summaryOnly === true,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Execute bulk plot import for tenant-scoped producers' })
  async execute(@Req() req: any, @Body() body: { rows?: BulkPlotImportInputRow[] }) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const email = typeof req.user?.email === 'string' ? req.user.email : undefined;
    const fullName =
      typeof req.user?.user_metadata?.full_name === 'string'
        ? req.user.user_metadata.full_name
        : typeof req.user?.user_metadata?.fullName === 'string'
          ? req.user.user_metadata.fullName
          : undefined;
    return this.bulkPlotImportService.execute({
      tenantId,
      userId,
      rows: body?.rows ?? [],
      actorEmail: email,
      actorFullName: fullName,
    });
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Queue async bulk plot import job for large payloads' })
  async createJob(@Req() req: any, @Body() body: { rows?: BulkPlotImportInputRow[] }) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    const email = typeof req.user?.email === 'string' ? req.user.email : undefined;
    const fullName =
      typeof req.user?.user_metadata?.full_name === 'string'
        ? req.user.user_metadata.full_name
        : typeof req.user?.user_metadata?.fullName === 'string'
          ? req.user.user_metadata.fullName
          : undefined;
    return this.bulkPlotImportJobService.createJob({
      tenantId,
      userId,
      rows: body?.rows ?? [],
      actorEmail: email,
      actorFullName: fullName,
    });
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get async bulk plot import job progress' })
  getJob(@Req() req: any, @Param('id') jobId: string) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    return this.bulkPlotImportJobService.getJob(tenantId, jobId);
  }

  @Post('evidence')
  @ApiOperation({ summary: 'Attach evidence files from tracebud_import_v1 package references' })
  async importEvidence(
    @Req() req: any,
    @Body() body: { items?: BulkPlotImportEvidenceItemInput[] },
  ) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const items = body?.items ?? [];
    if (items.length > BULK_PLOT_IMPORT_EVIDENCE_MAX_ITEMS) {
      throw new ForbiddenException(
        `Bulk evidence import supports up to ${BULK_PLOT_IMPORT_EVIDENCE_MAX_ITEMS} files per request.`,
      );
    }

    for (const item of items) {
      const byteLength = Buffer.byteLength(item.contentBase64 ?? '', 'base64');
      if (byteLength > BULK_PLOT_IMPORT_EVIDENCE_MAX_BYTES) {
        throw new ForbiddenException(
          `Evidence file ${item.documentRef} exceeds the ${BULK_PLOT_IMPORT_EVIDENCE_MAX_BYTES} byte limit.`,
        );
      }
    }

    return this.bulkPlotImportEvidenceService.importEvidence({
      tenantId,
      userId,
      items,
    });
  }
}
