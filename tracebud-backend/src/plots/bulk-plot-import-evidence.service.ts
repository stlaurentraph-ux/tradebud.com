import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { ConsentService } from '../consent/consent.service';
import { createSupabaseServerClient } from '../auth/supabase-server.client';
import { isFarmerInTenant } from '../common/tenant-farmer-scope';
import { PlotsService } from './plots.service';
import type {
  BulkPlotImportEvidenceItemInput,
  BulkPlotImportEvidenceResponse,
  BulkPlotImportEvidenceRowResult,
} from './bulk-plot-import.types';

const EVIDENCE_KINDS = new Set([
  'fpic_repository',
  'protected_area_permit',
  'labor_evidence',
  'tenure_evidence',
]);

@Injectable()
export class BulkPlotImportEvidenceService {
  private readonly logger = new Logger(BulkPlotImportEvidenceService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly plotsService: PlotsService,
    private readonly consentService: ConsentService,
  ) {}

  async importEvidence(params: {
    tenantId: string;
    userId: string;
    items: BulkPlotImportEvidenceItemInput[];
  }): Promise<BulkPlotImportEvidenceResponse> {
    const items = params.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('At least one evidence item is required.');
    }

    const rows: BulkPlotImportEvidenceRowResult[] = [];

    for (const item of items) {
      rows.push(await this.importOneItem(params.tenantId, params.userId, item));
    }

    return {
      totalItems: rows.length,
      importedCount: rows.filter((row) => row.status === 'IMPORTED').length,
      failedCount: rows.filter((row) => row.status !== 'IMPORTED').length,
      rows,
    };
  }

  private async importOneItem(
    tenantId: string,
    userId: string,
    item: BulkPlotImportEvidenceItemInput,
  ): Promise<BulkPlotImportEvidenceRowResult> {
    const clientPlotId = item.clientPlotId?.trim() ?? '';
    const documentRef = item.documentRef?.trim() ?? '';

    if (!clientPlotId || !documentRef) {
      return {
        clientPlotId,
        documentRef,
        status: 'VALIDATION_FAILED',
        message: 'clientPlotId and documentRef are required.',
      };
    }

    if (!EVIDENCE_KINDS.has(item.evidenceKind)) {
      return {
        clientPlotId,
        documentRef,
        status: 'VALIDATION_FAILED',
        message: `Unsupported evidence kind "${item.evidenceKind}".`,
      };
    }

    let bytes: Buffer;
    try {
      bytes = Buffer.from(item.contentBase64, 'base64');
    } catch {
      return {
        clientPlotId,
        documentRef,
        status: 'VALIDATION_FAILED',
        message: 'contentBase64 is not valid base64.',
      };
    }

    if (bytes.length === 0) {
      return {
        clientPlotId,
        documentRef,
        status: 'VALIDATION_FAILED',
        message: 'Evidence file is empty.',
      };
    }

    if (item.expectedSha256?.trim()) {
      const actual = createHash('sha256').update(bytes).digest('hex');
      if (actual.toLowerCase() !== item.expectedSha256.trim().toLowerCase()) {
        return {
          clientPlotId,
          documentRef,
          status: 'VALIDATION_FAILED',
          message: 'file_hash_sha256 does not match the uploaded file.',
        };
      }
    }

    try {
      const plot = await this.resolvePlotForTenant(tenantId, clientPlotId);
      if (!plot) {
        return {
          clientPlotId,
          documentRef,
          status: 'VALIDATION_FAILED',
          message: 'Plot not found for client_plot_id in this tenant.',
        };
      }

      const allowed = await this.consentService.canTenantAccessFarmerEvidence(plot.farmerId, tenantId);
      if (!allowed) {
        return {
          clientPlotId,
          documentRef,
          status: 'FAILED',
          message: 'Tenant does not have consent to attach evidence for this producer.',
        };
      }

      const storagePath = await this.uploadEvidenceFile({
        farmerUserId: plot.farmerUserId,
        plotId: plot.plotId,
        evidenceKind: item.evidenceKind,
        documentRef,
        fileName: item.fileName,
        mimeType: item.mimeType,
        bytes,
      });

      await this.plotsService.syncEvidence(
        plot.plotId,
        {
          kind: item.evidenceKind,
          items: [
            {
              storagePath,
              mimeType: item.mimeType,
              label: item.fileName || documentRef,
            },
          ],
          reason: 'bulk_plot_import_evidence',
          note: `Imported from tracebud_import_v1 evidence reference ${documentRef}.`,
        },
        userId,
        tenantId,
      );

      return {
        clientPlotId,
        documentRef,
        status: 'IMPORTED',
        plotId: plot.plotId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evidence import failed.';
      this.logger.warn(`Bulk evidence import failed for ${clientPlotId}/${documentRef}: ${message}`);
      return {
        clientPlotId,
        documentRef,
        status: 'FAILED',
        message,
      };
    }
  }

  private async resolvePlotForTenant(
    tenantId: string,
    clientPlotId: string,
  ): Promise<{ plotId: string; farmerId: string; farmerUserId: string } | null> {
    const res = await this.pool.query<{
      plot_id: string;
      farmer_id: string;
      farmer_user_id: string | null;
    }>(
      `
        SELECT
          p.id::text AS plot_id,
          p.farmer_id::text AS farmer_id,
          fp.user_id::text AS farmer_user_id
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        WHERE p.client_plot_id = $2
        LIMIT 1
      `,
      [tenantId, clientPlotId],
    );

    const row = res.rows[0];
    if (!row?.plot_id || !row.farmer_id) {
      return null;
    }

    if (!(await isFarmerInTenant(this.pool, row.farmer_id, tenantId))) {
      return null;
    }

    if (!row.farmer_user_id) {
      throw new BadRequestException('Producer auth user is missing for this plot.');
    }

    return {
      plotId: row.plot_id,
      farmerId: row.farmer_id,
      farmerUserId: row.farmer_user_id,
    };
  }

  private async uploadEvidenceFile(params: {
    farmerUserId: string;
    plotId: string;
    evidenceKind: string;
    documentRef: string;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
  }): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException('Evidence storage upload is not configured.');
    }

    const safeName = (params.fileName || params.documentRef)
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 80);
    const storagePath = `${params.farmerUserId}/${params.plotId}/${params.evidenceKind}/bulk-${params.documentRef}-${safeName}`;

    const bucket = process.env.EVIDENCE_STORAGE_BUCKET?.trim() || 'plot-evidence';
    const supabase = createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.storage.from(bucket).upload(storagePath, params.bytes, {
      contentType: params.mimeType || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      throw new BadRequestException(error.message ?? 'Could not upload evidence file.');
    }

    return storagePath;
  }
}
