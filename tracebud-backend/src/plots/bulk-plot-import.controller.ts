import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { deriveRoleFromSupabaseUser, deriveTenantIdFromSupabaseUser } from '../auth/roles';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BulkPlotImportEvidenceService } from './bulk-plot-import-evidence.service';
import { BulkPlotImportIntegratorKeyService } from './bulk-plot-import-integrator-key.service';
import { BulkPlotImportJobService } from './bulk-plot-import-job.service';
import { BulkPlotImportObservabilityService } from './bulk-plot-import-observability.service';
import { BulkPlotImportPackageService } from './bulk-plot-import-package.service';
import { BulkPlotImportPolicyService } from './bulk-plot-import-policy.service';
import { BulkPlotImportService } from './bulk-plot-import.service';
import { BulkPlotImportSigningKeyService } from './bulk-plot-import-signing-key.service';
import type { TracebudImportV1PackageInput } from './bulk-plot-import-package.util';
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
    private readonly bulkPlotImportPackageService: BulkPlotImportPackageService,
    private readonly bulkPlotImportSigningKeyService: BulkPlotImportSigningKeyService,
    private readonly bulkPlotImportPolicyService: BulkPlotImportPolicyService,
    private readonly bulkPlotImportIntegratorKeyService: BulkPlotImportIntegratorKeyService,
    private readonly bulkPlotImportObservabilityService: BulkPlotImportObservabilityService,
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

  private assertSigningKeyAdmin(req: any): void {
    const role = deriveRoleFromSupabaseUser(req?.user);
    this.bulkPlotImportSigningKeyService.assertSigningKeyAdminRole(role);
  }

  @Get('signing-keys')
  @ApiOperation({ summary: 'List tenant import signing keys' })
  listSigningKeys(@Req() req: any) {
    this.assertBulkPlotImportAccess(req);
    return this.bulkPlotImportSigningKeyService.listKeys(this.getTenantId(req));
  }

  @Post('signing-keys')
  @ApiOperation({ summary: 'Register tenant Ed25519 import signing public key' })
  registerSigningKey(
    @Req() req: any,
    @Body() body: { kid?: string; label?: string; publicKeyPem?: string },
  ) {
    this.assertSigningKeyAdmin(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.bulkPlotImportSigningKeyService.registerKey({
      tenantId,
      userId,
      kid: body?.kid ?? '',
      label: body?.label ?? '',
      publicKeyPem: body?.publicKeyPem ?? '',
    });
  }

  @Post('signing-keys/:id/revoke')
  @ApiOperation({ summary: 'Revoke tenant import signing key' })
  revokeSigningKey(@Req() req: any, @Param('id') keyId: string) {
    this.assertSigningKeyAdmin(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.bulkPlotImportSigningKeyService.revokeKey({ tenantId, userId, keyId });
  }

  @Get('policy')
  @ApiOperation({ summary: 'Get tenant bulk import signing policy' })
  getPolicy(@Req() req: any) {
    this.assertBulkPlotImportAccess(req);
    return this.bulkPlotImportPolicyService.getPolicy(this.getTenantId(req));
  }

  @Patch('policy')
  @ApiOperation({ summary: 'Update tenant bulk import signing policy' })
  updatePolicy(
    @Req() req: any,
    @Body()
    body: {
      requireSignedPackages?: boolean;
      acceptIntegratorSignatures?: boolean;
    },
  ) {
    this.assertSigningKeyAdmin(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.bulkPlotImportPolicyService.updatePolicy({
      tenantId,
      userId,
      requireSignedPackages: body?.requireSignedPackages,
      acceptIntegratorSignatures: body?.acceptIntegratorSignatures,
    });
  }

  @Get('integrator-keys')
  @ApiOperation({ summary: 'List Tracebud-approved integrator signing keys' })
  listIntegratorKeys(@Req() req: any) {
    this.assertBulkPlotImportAccess(req);
    return this.bulkPlotImportIntegratorKeyService.listActiveKeys();
  }

  @Post('packages/verify')
  @ApiOperation({ summary: 'Verify tracebud_import_v1 package hash and optional signature' })
  async verifyPackage(@Req() req: any, @Body() body: { importPackage?: TracebudImportV1PackageInput }) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!body?.importPackage) {
      throw new BadRequestException('importPackage is required.');
    }
    const pkg = this.bulkPlotImportPackageService.assertPackageShape(body.importPackage);
    return this.bulkPlotImportPackageService.verifyPackage({
      tenantId,
      userId,
      pkg,
      audit: true,
    });
  }

  @Post('preview')
  @ApiOperation({ summary: 'Validate bulk plot import rows without writing data' })
  async preview(
    @Req() req: any,
    @Body()
    body: {
      rows?: BulkPlotImportInputRow[];
      summaryOnly?: boolean;
      importPackage?: TracebudImportV1PackageInput;
    },
  ) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    await this.bulkPlotImportPackageService.assertPackageImportable({
      tenantId,
      userId,
      importPackage: body?.importPackage,
    });
    return this.bulkPlotImportService.preview(tenantId, body?.rows ?? [], {
      summaryOnly: body?.summaryOnly === true,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Execute bulk plot import for tenant-scoped producers' })
  async execute(
    @Req() req: any,
    @Body() body: { rows?: BulkPlotImportInputRow[]; importPackage?: TracebudImportV1PackageInput },
  ) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    await this.bulkPlotImportPackageService.assertPackageImportable({
      tenantId,
      userId,
      importPackage: body?.importPackage,
    });
    const email = typeof req.user?.email === 'string' ? req.user.email : undefined;
    const fullName =
      typeof req.user?.user_metadata?.full_name === 'string'
        ? req.user.user_metadata.full_name
        : typeof req.user?.user_metadata?.fullName === 'string'
          ? req.user.user_metadata.fullName
          : undefined;
    const result = await this.bulkPlotImportService.execute({
      tenantId,
      userId,
      rows: body?.rows ?? [],
      actorEmail: email,
      actorFullName: fullName,
    });
    await this.bulkPlotImportObservabilityService.recordExecuteCompleted({
      tenantId,
      userId,
      mode: 'sync',
      totalRows: result.totalRows,
      importedCount: result.importedCount,
      duplicateSkippedCount: result.duplicateSkippedCount,
      failedCount: result.failedCount,
      sourceSystem: body?.importPackage?.source_system ?? null,
    });
    return result;
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Queue async bulk plot import job for large payloads' })
  async createJob(
    @Req() req: any,
    @Body() body: { rows?: BulkPlotImportInputRow[]; importPackage?: TracebudImportV1PackageInput },
  ) {
    this.assertBulkPlotImportAccess(req);
    const tenantId = this.getTenantId(req);
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    await this.bulkPlotImportPackageService.assertPackageImportable({
      tenantId,
      userId,
      importPackage: body?.importPackage,
    });
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
