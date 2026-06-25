import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createSupabaseServerClient } from '../auth/supabase-server.client';
import {
  BulkPlotImportObservabilityService,
  type BulkPlotImportStorageMode,
} from './bulk-plot-import-observability.service';
import type { BulkPlotImportInputRow } from './bulk-plot-import.types';

export const BULK_PLOT_IMPORT_OBJECT_STORAGE_MIN_BYTES = 512 * 1024;

export type BulkPlotImportJobPayload = {
  rows: BulkPlotImportInputRow[];
  actorEmail?: string;
  actorFullName?: string;
};

export type StoredBulkPlotImportJobPayload = {
  payloadJsonb: Record<string, unknown>;
  fileStorageKey: string | null;
  storageMode: BulkPlotImportStorageMode;
};

@Injectable()
export class BulkPlotImportJobStorageService {
  private readonly logger = new Logger(BulkPlotImportJobStorageService.name);

  constructor(private readonly observability: BulkPlotImportObservabilityService) {}

  shouldUseObjectStorage(serializedPayload: string): boolean {
    return Buffer.byteLength(serializedPayload, 'utf8') >= BULK_PLOT_IMPORT_OBJECT_STORAGE_MIN_BYTES;
  }

  async persistJobPayload(params: {
    tenantId: string;
    jobId: string;
    userId?: string;
    payload: BulkPlotImportJobPayload;
  }): Promise<StoredBulkPlotImportJobPayload> {
    const serialized = JSON.stringify(params.payload);
    const payloadBytes = Buffer.byteLength(serialized, 'utf8');
    if (!this.shouldUseObjectStorage(serialized)) {
      this.observability.log('job_payload_persisted', {
        tenantId: params.tenantId,
        jobId: params.jobId,
        storageMode: 'inline',
        payloadBytes,
        rowCount: params.payload.rows.length,
      });
      return {
        fileStorageKey: null,
        storageMode: 'inline',
        payloadJsonb: {
          ...params.payload,
          storageMode: 'inline',
        },
      };
    }

    const storagePath = `${params.tenantId}/${params.jobId}.json`;
    const uploaded = await this.uploadJson(storagePath, serialized);
    if (!uploaded) {
      await this.observability.recordStorageFallback({
        tenantId: params.tenantId,
        userId: params.userId,
        jobId: params.jobId,
        reason: 'object_storage_unavailable',
        payloadBytes,
      });
      return {
        fileStorageKey: null,
        storageMode: 'inline_fallback',
        payloadJsonb: {
          ...params.payload,
          storageMode: 'inline_fallback',
        },
      };
    }

    this.observability.log('job_payload_persisted', {
      tenantId: params.tenantId,
      jobId: params.jobId,
      storageMode: 'object_storage',
      payloadBytes,
      rowCount: params.payload.rows.length,
      fileStorageKey: storagePath,
    });

    return {
      fileStorageKey: storagePath,
      storageMode: 'object_storage',
      payloadJsonb: {
        payloadStorage: true,
        storageMode: 'object_storage',
        rowCount: params.payload.rows.length,
        actorEmail: params.payload.actorEmail ?? null,
        actorFullName: params.payload.actorFullName ?? null,
      },
    };
  }

  async loadJobPayload(params: {
    payloadJsonb: Record<string, unknown> | null | undefined;
    fileStorageKey?: string | null;
  }): Promise<BulkPlotImportJobPayload & { storageMode: BulkPlotImportStorageMode }> {
    if (params.fileStorageKey?.trim()) {
      const downloaded = await this.downloadJson(params.fileStorageKey.trim());
      if (!downloaded) {
        throw new InternalServerErrorException('Bulk import job payload could not be loaded from storage.');
      }
      const parsed = JSON.parse(downloaded) as BulkPlotImportJobPayload;
      return {
        rows: Array.isArray(parsed.rows) ? parsed.rows : [],
        actorEmail: parsed.actorEmail,
        actorFullName: parsed.actorFullName,
        storageMode: 'object_storage',
      };
    }

    const payload = params.payloadJsonb ?? {};
    const storageMode =
      payload.storageMode === 'inline_fallback'
        ? 'inline_fallback'
        : payload.storageMode === 'object_storage'
          ? 'object_storage'
          : 'inline';
    return {
      rows: Array.isArray(payload.rows) ? (payload.rows as BulkPlotImportInputRow[]) : [],
      actorEmail: typeof payload.actorEmail === 'string' ? payload.actorEmail : undefined,
      actorFullName: typeof payload.actorFullName === 'string' ? payload.actorFullName : undefined,
      storageMode,
    };
  }

  private getStorageClient() {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }
    const bucket = process.env.BULK_IMPORT_STORAGE_BUCKET?.trim() || 'bulk-import-jobs';
    const supabase = createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { supabase, bucket };
  }

  private async uploadJson(storagePath: string, body: string): Promise<boolean> {
    const client = this.getStorageClient();
    if (!client) return false;
    const { error } = await client.supabase.storage
      .from(client.bucket)
      .upload(storagePath, Buffer.from(body, 'utf8'), {
        contentType: 'application/json',
        upsert: true,
      });
    if (error) {
      this.logger.warn(
        JSON.stringify({
          scope: 'bulk_plot_import',
          event: 'job_payload_upload_failed',
          storagePath,
          message: error.message,
        }),
      );
      return false;
    }
    return true;
  }

  private async downloadJson(storagePath: string): Promise<string | null> {
    const client = this.getStorageClient();
    if (!client) return null;
    const { data, error } = await client.supabase.storage.from(client.bucket).download(storagePath);
    if (error || !data) {
      this.logger.warn(
        JSON.stringify({
          scope: 'bulk_plot_import',
          event: 'job_payload_download_failed',
          storagePath,
          message: error?.message ?? 'missing object',
        }),
      );
      return null;
    }
    return data.text();
  }
}
