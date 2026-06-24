import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { BulkPlotImportJobStorageService } from './bulk-plot-import-job-storage.service';
import {
  BulkPlotImportObservabilityService,
} from './bulk-plot-import-observability.service';
import { BulkPlotImportService } from './bulk-plot-import.service';
import {
  BULK_PLOT_IMPORT_ASYNC_MAX_ROWS,
  BULK_PLOT_IMPORT_SYNC_MAX_ROWS,
  type BulkPlotImportInputRow,
  type BulkPlotImportJobResponse,
  type BulkPlotImportJobStatus,
} from './bulk-plot-import.types';

const JOB_BATCH_SIZE = 100;
const FAILURE_SAMPLE_LIMIT = 25;

type BulkImportJobRow = {
  id: string;
  tenant_id: string;
  import_type: string;
  file_hash_sha256: string;
  file_storage_key: string | null;
  payload_jsonb: Record<string, unknown> | null;
  total_records: number;
  processed_records: number;
  success_count: number;
  failure_count: number;
  duplicate_skipped_count: number;
  status: BulkPlotImportJobStatus;
  error_summary: Record<string, unknown> | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class BulkPlotImportJobService {
  private readonly logger = new Logger(BulkPlotImportJobService.name);
  private readonly processingJobIds = new Set<string>();

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly bulkPlotImportService: BulkPlotImportService,
    private readonly jobStorage: BulkPlotImportJobStorageService,
    private readonly observability: BulkPlotImportObservabilityService,
  ) {}

  async createJob(params: {
    tenantId: string;
    userId: string;
    rows: BulkPlotImportInputRow[];
    actorEmail?: string;
    actorFullName?: string;
  }): Promise<BulkPlotImportJobResponse> {
    const rows = params.rows ?? [];
    this.assertAsyncRowLimit(rows);

    if (rows.length <= BULK_PLOT_IMPORT_SYNC_MAX_ROWS) {
      throw new BadRequestException(
        `Use synchronous import for ${BULK_PLOT_IMPORT_SYNC_MAX_ROWS} rows or fewer. Async jobs are for larger imports.`,
      );
    }

    const payload = {
      rows,
      actorEmail: params.actorEmail,
      actorFullName: params.actorFullName,
    };
    const fileHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const jobId = randomUUID();
    const stored = await this.jobStorage.persistJobPayload({
      tenantId: params.tenantId,
      jobId,
      userId: params.userId,
      payload,
    });

    await this.pool.query(
      `INSERT INTO bulk_import_jobs (
        id, tenant_id, import_type, file_hash_sha256, file_storage_key, payload_jsonb,
        total_records, status, created_by_id
      ) VALUES ($1, $2, 'PLOTS', $3, $4, $5::jsonb, $6, 'QUEUED', $7)`,
      [
        jobId,
        params.tenantId,
        fileHash,
        stored.fileStorageKey,
        JSON.stringify(stored.payloadJsonb),
        rows.length,
        params.userId,
      ],
    );

    this.observability.log('job_queued', {
      tenantId: params.tenantId,
      jobId,
      userId: params.userId,
      rowCount: rows.length,
      storageMode: stored.storageMode,
    });

    const job = await this.getJob(params.tenantId, jobId);
    this.scheduleProcessing(jobId);
    return job;
  }

  async getJob(tenantId: string, jobId: string): Promise<BulkPlotImportJobResponse> {
    const result = await this.pool.query<BulkImportJobRow>(
      `SELECT *
       FROM bulk_import_jobs
       WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Bulk import job not found.');
    }
    return this.toJobResponse(row);
  }

  private scheduleProcessing(jobId: string): void {
    setImmediate(() => {
      void this.processJob(jobId).catch(async (error) => {
        const message = error instanceof Error ? error.message : 'Bulk import job failed.';
        this.logger.error(`Bulk import job ${jobId} crashed: ${message}`);
        try {
          const result = await this.pool.query<BulkImportJobRow>(
            `SELECT tenant_id, created_by_id FROM bulk_import_jobs WHERE id = $1 LIMIT 1`,
            [jobId],
          );
          const row = result.rows[0];
          await this.observability.recordJobCrashed({
            tenantId: row?.tenant_id ?? null,
            userId: row?.created_by_id ?? null,
            jobId,
            message,
          });
        } catch (auditError) {
          const auditMessage =
            auditError instanceof Error ? auditError.message : 'Failed to record job crash audit.';
          this.logger.error(`Bulk import job ${jobId} crash audit failed: ${auditMessage}`);
        }
      });
    });
  }

  private async processJob(jobId: string): Promise<void> {
    if (this.processingJobIds.has(jobId)) return;
    this.processingJobIds.add(jobId);

    try {
      const claimed = await this.pool.query<BulkImportJobRow>(
        `UPDATE bulk_import_jobs
         SET status = 'PROCESSING',
             started_at = COALESCE(started_at, NOW()),
             updated_at = NOW()
         WHERE id = $1 AND status IN ('QUEUED', 'PROCESSING')
         RETURNING *`,
        [jobId],
      );
      const job = claimed.rows[0];
      if (!job) return;

      this.observability.log('job_processing_started', {
        tenantId: job.tenant_id,
        jobId,
        userId: job.created_by_id,
        totalRecords: job.total_records,
      });

      const payload = await this.jobStorage.loadJobPayload({
        payloadJsonb: job.payload_jsonb,
        fileStorageKey: job.file_storage_key,
      });
      const rows = payload.rows;
      const storageMode = payload.storageMode;
      const failureSamples: Array<{ rowIndex: number; clientPlotId: string; message?: string }> = [];

      let processedRecords = job.processed_records;
      let successCount = job.success_count;
      let failureCount = job.failure_count;
      let duplicateSkippedCount = job.duplicate_skipped_count;

      for (let offset = processedRecords; offset < rows.length; offset += JOB_BATCH_SIZE) {
        const batch = rows.slice(offset, offset + JOB_BATCH_SIZE);
        const result = await this.bulkPlotImportService.execute({
          tenantId: job.tenant_id,
          userId: job.created_by_id,
          rows: batch,
          actorEmail: payload.actorEmail,
          actorFullName: payload.actorFullName,
          skipRowLimit: true,
        });

        await this.observability.recordExecuteCompleted({
          tenantId: job.tenant_id,
          userId: job.created_by_id,
          mode: 'async_batch',
          jobId,
          totalRows: result.totalRows,
          importedCount: result.importedCount,
          duplicateSkippedCount: result.duplicateSkippedCount,
          failedCount: result.failedCount,
        });

        successCount += result.importedCount;
        failureCount += result.failedCount;
        duplicateSkippedCount += result.duplicateSkippedCount;
        processedRecords += batch.length;

        for (const row of result.rows) {
          if (
            failureSamples.length < FAILURE_SAMPLE_LIMIT &&
            (row.status === 'FAILED' || row.status === 'VALIDATION_FAILED')
          ) {
            failureSamples.push({
              rowIndex: row.rowIndex,
              clientPlotId: row.clientPlotId,
              message: row.message,
            });
          }
        }

        await this.pool.query(
          `UPDATE bulk_import_jobs
           SET processed_records = $2,
               success_count = $3,
               failure_count = $4,
               duplicate_skipped_count = $5,
               updated_at = NOW()
           WHERE id = $1`,
          [jobId, processedRecords, successCount, failureCount, duplicateSkippedCount],
        );
      }

      const finalStatus: BulkPlotImportJobStatus =
        failureCount === 0
          ? 'COMPLETED'
          : successCount + duplicateSkippedCount === 0
            ? 'FAILED'
            : 'PARTIAL';

      await this.pool.query(
        `UPDATE bulk_import_jobs
         SET status = $2,
             processed_records = $3,
             success_count = $4,
             failure_count = $5,
             duplicate_skipped_count = $6,
             error_summary = $7::jsonb,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [
          jobId,
          finalStatus,
          processedRecords,
          successCount,
          failureCount,
          duplicateSkippedCount,
          JSON.stringify({
            failureSamples,
            importedCount: successCount,
            duplicateSkippedCount,
            storageMode,
          }),
        ],
      );

      await this.observability.recordJobCompleted({
        tenantId: job.tenant_id,
        userId: job.created_by_id,
        jobId,
        status: finalStatus,
        totalRecords: job.total_records,
        successCount,
        failureCount,
        duplicateSkippedCount,
        storageMode,
      });
    } finally {
      this.processingJobIds.delete(jobId);
    }
  }

  private assertAsyncRowLimit(rows: BulkPlotImportInputRow[]): void {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('At least one import row is required.');
    }
    if (rows.length > BULK_PLOT_IMPORT_ASYNC_MAX_ROWS) {
      throw new BadRequestException(
        `Bulk plot import jobs support up to ${BULK_PLOT_IMPORT_ASYNC_MAX_ROWS} rows per job.`,
      );
    }
  }

  private toJobResponse(row: BulkImportJobRow): BulkPlotImportJobResponse {
    return {
      id: row.id,
      status: row.status,
      importType: 'PLOTS',
      totalRecords: row.total_records,
      processedRecords: row.processed_records,
      successCount: row.success_count,
      failureCount: row.failure_count,
      duplicateSkippedCount: row.duplicate_skipped_count,
      startedAt: row.started_at?.toISOString() ?? null,
      completedAt: row.completed_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      errorSummary: row.error_summary,
    };
  }
}
