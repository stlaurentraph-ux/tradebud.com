import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type BulkPlotImportLogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

export type BulkPlotImportStorageMode = 'inline' | 'object_storage' | 'inline_fallback';

@Injectable()
export class BulkPlotImportObservabilityService {
  private readonly logger = new Logger(BulkPlotImportObservabilityService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  log(event: string, fields: BulkPlotImportLogFields): void {
    this.logger.log(JSON.stringify({ scope: 'bulk_plot_import', event, ...fields }));
  }

  warn(event: string, fields: BulkPlotImportLogFields): void {
    this.logger.warn(JSON.stringify({ scope: 'bulk_plot_import', event, ...fields }));
  }

  error(event: string, fields: BulkPlotImportLogFields): void {
    this.logger.error(JSON.stringify({ scope: 'bulk_plot_import', event, ...fields }));
  }

  async audit(params: {
    userId?: string | null;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [params.userId ?? null, params.eventType, JSON.stringify(params.payload)],
    );
  }

  async recordExecuteCompleted(params: {
    tenantId: string;
    userId: string;
    mode: 'sync' | 'async_batch';
    jobId?: string | null;
    totalRows: number;
    importedCount: number;
    duplicateSkippedCount: number;
    failedCount: number;
    sourceSystem?: string | null;
    signerType?: string | null;
  }): Promise<void> {
    const payload = {
      tenantId: params.tenantId,
      mode: params.mode,
      jobId: params.jobId ?? null,
      totalRows: params.totalRows,
      importedCount: params.importedCount,
      duplicateSkippedCount: params.duplicateSkippedCount,
      failedCount: params.failedCount,
      sourceSystem: params.sourceSystem ?? null,
      signerType: params.signerType ?? null,
    };
    this.log('execute_completed', payload);
    if (params.mode === 'sync') {
      await this.audit({
        userId: params.userId,
        eventType: 'bulk_import_execute_completed',
        payload,
      });
    }
  }

  async recordJobCompleted(params: {
    tenantId: string;
    userId: string;
    jobId: string;
    status: string;
    totalRecords: number;
    successCount: number;
    failureCount: number;
    duplicateSkippedCount: number;
    storageMode: BulkPlotImportStorageMode;
  }): Promise<void> {
    const payload = {
      tenantId: params.tenantId,
      jobId: params.jobId,
      status: params.status,
      totalRecords: params.totalRecords,
      successCount: params.successCount,
      failureCount: params.failureCount,
      duplicateSkippedCount: params.duplicateSkippedCount,
      storageMode: params.storageMode,
    };
    this.log('job_completed', payload);
    await this.audit({
      userId: params.userId,
      eventType: 'bulk_import_job_completed',
      payload,
    });
  }

  async recordJobCrashed(params: {
    tenantId?: string | null;
    userId?: string | null;
    jobId: string;
    message: string;
  }): Promise<void> {
    const payload = {
      tenantId: params.tenantId ?? null,
      jobId: params.jobId,
      message: params.message,
    };
    this.error('job_crashed', payload);
    await this.audit({
      userId: params.userId,
      eventType: 'bulk_import_job_crashed',
      payload,
    });
  }

  async recordStorageFallback(params: {
    tenantId: string;
    userId?: string | null;
    jobId: string;
    reason: string;
    payloadBytes: number;
  }): Promise<void> {
    const payload = {
      tenantId: params.tenantId,
      jobId: params.jobId,
      reason: params.reason,
      payloadBytes: params.payloadBytes,
      storageMode: 'inline_fallback' satisfies BulkPlotImportStorageMode,
    };
    this.warn('job_payload_storage_fallback', payload);
    await this.audit({
      userId: params.userId,
      eventType: 'bulk_import_job_payload_storage_fallback',
      payload,
    });
  }
}
