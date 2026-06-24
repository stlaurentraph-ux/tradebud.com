import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BulkPlotImportService } from './bulk-plot-import.service';
import type { BulkPlotImportInputRow } from './bulk-plot-import.types';

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
  constructor(private readonly bulkPlotImportService: BulkPlotImportService) {}

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
  preview(@Req() req: any, @Body() body: { rows?: BulkPlotImportInputRow[] }) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    return this.bulkPlotImportService.preview(tenantId, body?.rows ?? []);
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
}
