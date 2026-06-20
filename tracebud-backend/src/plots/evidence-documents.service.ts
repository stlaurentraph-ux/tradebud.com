import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import type { TenureParseResultV1, TenureParseStatus } from './tenure-parse.types';
import { isFarmerWrongDocumentOutcome } from './tenure-parse.wrong-document';
import { TenureReviewAlertService } from './tenure-review-alert.service';

export type PlotEvidenceKind =
  | 'fpic_repository'
  | 'protected_area_permit'
  | 'labor_evidence'
  | 'tenure_evidence'
  | 'land_title';

export type EvidenceSyncItem = {
  storagePath?: string | null;
  mimeType?: string | null;
  label?: string | null;
};

const KIND_TO_DOCUMENT_TYPE: Record<PlotEvidenceKind, string> = {
  tenure_evidence: 'LAND_TITLE',
  land_title: 'LAND_TITLE',
  fpic_repository: 'CONSENT_FORM',
  protected_area_permit: 'IMPORT_PERMIT',
  labor_evidence: 'OTHER',
};

@Injectable()
export class EvidenceDocumentsService {
  private readonly logger = new Logger(EvidenceDocumentsService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly tenureReviewAlerts: TenureReviewAlertService,
  ) {}

  mapKindToDocumentType(kind: string): string {
    return KIND_TO_DOCUMENT_TYPE[kind as PlotEvidenceKind] ?? 'OTHER';
  }

  async upsertFromEvidenceSync(params: {
    plotId: string;
    tenantId?: string | null;
    userId?: string | null;
    kind: string;
    item: EvidenceSyncItem;
  }): Promise<string | null> {
    const storagePath = params.item.storagePath?.trim();
    if (!storagePath) return null;

    try {
      const res = await this.pool.query<{ id: string }>(
        `
          INSERT INTO evidence_documents (
            tenant_id,
            plot_id,
            evidence_kind,
            document_type,
            file_storage_key,
            mime_type,
            source_channel,
            source_uploaded_by,
            parse_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'MOBILE_UPLOAD', $7::uuid, 'PENDING')
          ON CONFLICT (plot_id, file_storage_key) DO UPDATE SET
            tenant_id = COALESCE(EXCLUDED.tenant_id, evidence_documents.tenant_id),
            mime_type = COALESCE(EXCLUDED.mime_type, evidence_documents.mime_type),
            updated_at = NOW()
          RETURNING id::text
        `,
        [
          params.tenantId ?? null,
          params.plotId,
          params.kind,
          this.mapKindToDocumentType(params.kind),
          storagePath,
          params.item.mimeType ?? null,
          params.userId ?? null,
        ],
      );

      const evidenceDocumentId = res.rows[0]?.id ?? null;
      if (evidenceDocumentId) {
        await this.writeProvenance({
          evidenceDocumentId,
          eventType: 'UPLOADED',
          actorType: params.userId ? 'PERSON' : 'SYSTEM',
          actorId: params.userId ?? null,
          payload: {
            plotId: params.plotId,
            evidenceKind: params.kind,
            storagePath,
            label: params.item.label ?? null,
          },
        });
      }
      return evidenceDocumentId;
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        this.logger.warn('evidence_documents table missing; skipping canonical document upsert.');
        return null;
      }
      throw error;
    }
  }

  async writeProvenance(params: {
    evidenceDocumentId: string;
    eventType: string;
    actorType?: 'PERSON' | 'SYSTEM' | 'API';
    actorId?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO document_provenance_events (
            evidence_document_id, event_type, actor_type, actor_id, payload
          )
          VALUES ($1, $2, $3, $4::uuid, $5::jsonb)
        `,
        [
          params.evidenceDocumentId,
          params.eventType,
          params.actorType ?? 'SYSTEM',
          params.actorId ?? null,
          JSON.stringify(params.payload ?? {}),
        ],
      );
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return;
      }
      throw error;
    }
  }

  async syncParseOutcome(params: {
    evidenceDocumentId: string | null;
    parseStatus: TenureParseStatus;
    parseResult: TenureParseResultV1 | Record<string, unknown> | null;
    parseConfidence: number | null;
    plotId: string;
    verificationId: string;
    tenantId?: string | null;
  }): Promise<void> {
    if (!params.evidenceDocumentId) return;

    try {
      await this.pool.query(
        `
          UPDATE evidence_documents
          SET
            parse_status = $2,
            parse_result = $3::jsonb,
            parse_confidence = $4,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          params.evidenceDocumentId,
          params.parseStatus,
          params.parseResult ? JSON.stringify(params.parseResult) : null,
          params.parseConfidence,
        ],
      );

      await this.writeProvenance({
        evidenceDocumentId: params.evidenceDocumentId,
        eventType: 'PARSE_COMPLETED',
        payload: {
          plotId: params.plotId,
          verificationId: params.verificationId,
          parse_status: params.parseStatus,
          parse_confidence: params.parseConfidence,
        },
      });

      if (params.parseStatus === 'MANUAL_REQUIRED' || params.parseStatus === 'FAILED') {
        if (isFarmerWrongDocumentOutcome(params.parseStatus, params.parseResult)) {
          return;
        }
        await this.upsertTenureComplianceIssue({
          tenantId: params.tenantId ?? null,
          verificationId: params.verificationId,
          plotId: params.plotId,
          parseStatus: params.parseStatus,
          parseResult: params.parseResult,
        });
        const plotMeta = await this.loadPlotAlertMeta(params.plotId);
        void this.tenureReviewAlerts.notifyTenureReviewRequired({
          tenantId: params.tenantId ?? null,
          plotId: params.plotId,
          verificationId: params.verificationId,
          plotName: plotMeta.plotName,
          farmerId: plotMeta.farmerId,
          parseStatus: params.parseStatus,
        });
      }
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return;
      }
      throw error;
    }
  }

  async markHumanReview(params: {
    evidenceDocumentId: string | null;
    userId: string;
    note?: string | null;
    plotId: string;
    verificationId: string;
  }): Promise<void> {
    if (!params.evidenceDocumentId) return;

    try {
      await this.pool.query(
        `
          UPDATE evidence_documents
          SET
            parse_status = 'COMPLETED',
            parse_reviewed_by = $2::uuid,
            parse_reviewed_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `,
        [params.evidenceDocumentId, params.userId],
      );

      await this.writeProvenance({
        evidenceDocumentId: params.evidenceDocumentId,
        eventType: 'REVIEWED',
        actorType: 'PERSON',
        actorId: params.userId,
        payload: {
          plotId: params.plotId,
          verificationId: params.verificationId,
          note: params.note ?? null,
        },
      });

      await this.resolveTenureComplianceIssue(params.verificationId, params.userId);
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return;
      }
      throw error;
    }
  }

  async resolveSupersededTenureVerification(verificationId: string): Promise<void> {
    try {
      await this.pool.query(
        `
          UPDATE compliance_issues
          SET status = 'resolved', updated_at = NOW()
          WHERE linked_entity_type = 'tenure_verification'
            AND linked_entity_id = $1
            AND status = 'open'
        `,
        [verificationId],
      );
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return;
      }
      throw error;
    }
  }

  private async upsertTenureComplianceIssue(params: {
    tenantId: string | null;
    verificationId: string;
    plotId: string;
    parseStatus: TenureParseStatus;
    parseResult: TenureParseResultV1 | Record<string, unknown> | null;
  }): Promise<void> {
    const missing = Array.isArray((params.parseResult as TenureParseResultV1 | null)?.clauses_missing)
      ? ((params.parseResult as TenureParseResultV1).clauses_missing as string[])
      : [];
    const severity = params.parseStatus === 'FAILED' ? 'WARNING' : 'WARNING';
    const title =
      params.parseStatus === 'FAILED'
        ? 'Tenure document parse failed'
        : 'Tenure document needs manual review';
    const description =
      missing.length > 0
        ? `AI tenure review flagged missing elements: ${missing.slice(0, 5).join(', ')}.`
        : 'AI tenure review requires exporter confirmation before plot land checklist can clear.';

    await this.pool.query(
      `
        INSERT INTO compliance_issues (
          tenant_id,
          severity,
          status,
          title,
          description,
          linked_entity_type,
          linked_entity_id,
          resolution_path,
          due_at,
          owner_role
        )
        VALUES ($1, $2, 'open', $3, $4, 'tenure_verification', $5, $6, NOW() + INTERVAL '3 days', 'exporter')
        ON CONFLICT (linked_entity_id)
          WHERE linked_entity_type = 'tenure_verification' AND status = 'open'
        DO UPDATE SET
          description = EXCLUDED.description,
          owner_role = COALESCE(compliance_issues.owner_role, EXCLUDED.owner_role),
          updated_at = NOW()
      `,
      [
        params.tenantId,
        severity,
        title,
        description,
        params.verificationId,
        'Open plot tenure panel, review file, and confirm tenure review when acceptable.',
      ],
    );
  }

  private async loadPlotAlertMeta(
    plotId: string,
  ): Promise<{ plotName: string | null; farmerId: string | null }> {
    try {
      const res = await this.pool.query<{ plot_name: string | null; farmer_id: string | null }>(
        `
          SELECT p.name AS plot_name, p.farmer_id::text AS farmer_id
          FROM plot p
          WHERE p.id = $1
          LIMIT 1
        `,
        [plotId],
      );
      return {
        plotName: res.rows[0]?.plot_name ?? null,
        farmerId: res.rows[0]?.farmer_id ?? null,
      };
    } catch {
      return { plotName: null, farmerId: null };
    }
  }

  private async resolveTenureComplianceIssue(
    verificationId: string,
    userId: string,
  ): Promise<void> {
    await this.pool.query(
      `
        UPDATE compliance_issues
        SET
          status = 'resolved',
          updated_at = NOW()
        WHERE linked_entity_type = 'tenure_verification'
          AND linked_entity_id = $1
          AND status = 'open'
      `,
      [verificationId],
    );

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, 'tenure_compliance_issue_resolved', $2::jsonb)
      `,
      [
        userId,
        JSON.stringify({
          verificationId,
        }),
      ],
    );
  }
}
