import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { resolveFarmerIdsForTenant } from '../common/tenant-farmer-scope';
import { EvidenceDocumentsService } from './evidence-documents.service';
import { applyCadastralCrossCheck, type PlotCadastralContext } from './cadastral-cross-check';
import { evaluateTenureParseResult } from './tenure-parse.evaluator';
import { isRetryableTenureParseFailure } from './tenure-parse.failure';
import {
  buildTenureParseRequestBody,
  extractJsonFromLlmContent,
  resolveTenureParseLlmConfig,
  tenureParsePrivacyWarning,
} from './tenure-parse.gateway';
import type {
  PlotTenureVerificationRow,
  TenureDocumentSource,
  TenureParseResultV1,
  TenureParseStatus,
  TenureType,
} from './tenure-parse.types';

type EvidenceSyncItem = {
  storagePath?: string | null;
  mimeType?: string | null;
  label?: string | null;
};

const TENURE_PARSE_SYSTEM_PROMPT = `You extract structured land-tenure fields from farmer-uploaded documents for EUDR compliance.
Return ONLY valid JSON matching this schema:
{
  "tenure_type": "FORMAL" | "CUSTOMARY" | "LEASEHOLD" | "POSSESSION_DECLARATION" | "UNKNOWN",
  "holder_name": string | null,
  "community_or_issuer": string | null,
  "parcel_reference": string | null,
  "issue_date": "YYYY-MM-DD" | null,
  "country_iso": string | null,
  "clauses_found": string[],
  "clauses_missing": string[],
  "anti_fraud": {
    "metadata_timestamp_plausible": boolean,
    "issuer_name_match": boolean,
    "document_age_within_policy": boolean
  },
  "confidence_breakdown": {
    "ocr_quality": number,
    "field_completeness": number
  },
  "summary": string | null
}
For customary / producer-in-possession letters, clauses_found may include occupation_rights, community_consent, witness_signatures, community_stamp.
List missing legal elements in clauses_missing. Be conservative: if unreadable, lower ocr_quality and list gaps.
If the file is readable but is NOT a land title, lease, possession letter, or cadastral document (e.g. selfie, landscape, receipt, unrelated photo), set tenure_type to UNKNOWN, add "not_a_land_document" to clauses_missing, keep ocr_quality high (>=0.7), set field_completeness low (<=0.2), and state that in summary.`;

const FORMAL_CADASTRAL_PARSE_SYSTEM_PROMPT = `You extract formal land-title and cadastral fields from farmer-uploaded documents (deeds, Clave Catastral certificates, municipal registrations) for EUDR compliance.
Return ONLY valid JSON matching this schema:
{
  "tenure_type": "FORMAL",
  "holder_name": string | null,
  "community_or_issuer": string | null,
  "parcel_reference": string | null,
  "title_number": string | null,
  "issue_date": "YYYY-MM-DD" | null,
  "country_iso": string | null,
  "clauses_found": string[],
  "clauses_missing": string[],
  "anti_fraud": {
    "metadata_timestamp_plausible": boolean,
    "issuer_name_match": boolean,
    "document_age_within_policy": boolean
  },
  "confidence_breakdown": {
    "ocr_quality": number,
    "field_completeness": number
  },
  "summary": string | null
}
Focus on Clave Catastral / parcel reference patterns (e.g. Honduras 012-345-678-9). Put the cadastral key in both parcel_reference and title_number when present. tenure_type must be FORMAL for deeds and cadastral certificates.
If the file is readable but is NOT a formal land title or cadastral document, set tenure_type to UNKNOWN, add "not_a_land_document" to clauses_missing, keep ocr_quality high, set field_completeness low, and explain in summary.`;

export type TenureReviewQueueItem = PlotTenureVerificationRow & {
  plot_name: string | null;
  farmer_name: string | null;
  farmer_id: string;
  compliance_issue_id: string | null;
};

@Injectable()
export class TenureParseService {
  private readonly logger = new Logger(TenureParseService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly evidenceDocuments: EvidenceDocumentsService,
  ) {}

  async enqueueFromEvidenceSync(
    plotId: string,
    kind: string,
    items: EvidenceSyncItem[],
    context?: { tenantId?: string | null; userId?: string | null },
  ): Promise<void> {
    if (kind !== 'tenure_evidence') return;

    const withFiles = items.filter(
      (item) => typeof item.storagePath === 'string' && item.storagePath.trim().length > 0,
    );
    if (withFiles.length === 0) return;

    try {
      await this.enqueueItems(plotId, withFiles, context);
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        this.logger.warn('plot_tenure_verification table missing; skipping tenure parse enqueue.');
        return;
      }
      throw error;
    }

    void this.processPendingForPlot(plotId).catch((error) => {
      this.logger.warn(`Tenure parse worker failed for plot ${plotId}: ${String(error)}`);
    });
  }

  async enqueueFromLandTitleSync(
    plotId: string,
    photos: EvidenceSyncItem[],
    context?: { tenantId?: string | null; userId?: string | null },
  ): Promise<void> {
    const withFiles = photos.filter(
      (item) => typeof item.storagePath === 'string' && item.storagePath.trim().length > 0,
    );
    if (withFiles.length === 0) return;

    try {
      await this.enqueueItems(plotId, withFiles, context, 'land_title');
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        this.logger.warn('plot_tenure_verification table missing; skipping land title parse enqueue.');
        return;
      }
      throw error;
    }

    void this.processPendingForPlot(plotId).catch((error) => {
      this.logger.warn(`Land title parse worker failed for plot ${plotId}: ${String(error)}`);
    });
  }

  async reevaluateCadastralCrossChecksForPlot(plotId: string): Promise<void> {
    try {
      const rows = await this.listForPlot(plotId);
      if (rows.length === 0) return;
      const context = await this.getPlotCadastralContext(plotId);

      for (const row of rows) {
        const existing = row.parse_result as TenureParseResultV1 | null;
        if (!existing || existing.parser === 'manual_required_stub') continue;

        const documentSource =
          existing.document_source ?? this.inferDocumentSource(row.storage_path);
        const withCrossCheck = applyCadastralCrossCheck(existing, context, documentSource);
        const evaluation = evaluateTenureParseResult(withCrossCheck);

        await this.pool.query(
          `
            UPDATE plot_tenure_verification
            SET
              parse_status = $2,
              parse_result = $3::jsonb,
              parse_confidence = $4,
              updated_at = NOW()
            WHERE id = $1
          `,
          [row.id, evaluation.parse_status, JSON.stringify(withCrossCheck), evaluation.parse_confidence],
        );

        const evidenceDoc = await this.pool.query<{ id: string | null; tenant_id: string | null }>(
          `
            SELECT ptv.evidence_document_id::text AS id, ed.tenant_id::text
            FROM plot_tenure_verification ptv
            LEFT JOIN evidence_documents ed ON ed.id = ptv.evidence_document_id
            WHERE ptv.id = $1
          `,
          [row.id],
        );
        const evidenceDocumentId = evidenceDoc.rows[0]?.id ?? null;

        await this.evidenceDocuments.syncParseOutcome({
          evidenceDocumentId,
          parseStatus: evaluation.parse_status,
          parseResult: withCrossCheck,
          parseConfidence: evaluation.parse_confidence,
          plotId,
          verificationId: row.id,
          tenantId: evidenceDoc.rows[0]?.tenant_id ?? null,
        });
      }
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') return;
      throw error;
    }
  }

  private async enqueueItems(
    plotId: string,
    withFiles: EvidenceSyncItem[],
    context?: { tenantId?: string | null; userId?: string | null },
    evidenceKind: 'tenure_evidence' | 'land_title' = 'tenure_evidence',
  ): Promise<void> {
    for (const item of withFiles) {
      const storagePath = item.storagePath!.trim();
      await this.supersedePriorLandDocumentVerifications(plotId, storagePath, evidenceKind);

      const evidenceDocumentId = await this.evidenceDocuments.upsertFromEvidenceSync({
        plotId,
        tenantId: context?.tenantId ?? null,
        userId: context?.userId ?? null,
        kind: evidenceKind,
        item,
      });

      await this.pool.query(
        `
          INSERT INTO plot_tenure_verification (
            plot_id, storage_path, mime_type, evidence_label, parse_status, evidence_document_id
          )
          VALUES ($1, $2, $3, $4, 'PENDING', $5::uuid)
          ON CONFLICT (plot_id, storage_path) DO UPDATE SET
            mime_type = COALESCE(EXCLUDED.mime_type, plot_tenure_verification.mime_type),
            evidence_label = COALESCE(EXCLUDED.evidence_label, plot_tenure_verification.evidence_label),
            evidence_document_id = COALESCE(
              EXCLUDED.evidence_document_id,
              plot_tenure_verification.evidence_document_id
            ),
            parse_status = CASE
              WHEN plot_tenure_verification.parse_status = 'COMPLETED'
                THEN 'COMPLETED'
              WHEN plot_tenure_verification.parse_status IN ('MANUAL_REQUIRED', 'FAILED')
                AND COALESCE((plot_tenure_verification.parse_result->>'retryable')::boolean, false)
                THEN 'PENDING'
              WHEN plot_tenure_verification.parse_status = 'MANUAL_REQUIRED'
                THEN 'MANUAL_REQUIRED'
              ELSE 'PENDING'
            END,
            parse_result = CASE
              WHEN plot_tenure_verification.parse_status IN ('MANUAL_REQUIRED', 'FAILED')
                AND COALESCE((plot_tenure_verification.parse_result->>'retryable')::boolean, false)
                THEN NULL
              ELSE plot_tenure_verification.parse_result
            END,
            parse_confidence = CASE
              WHEN plot_tenure_verification.parse_status IN ('MANUAL_REQUIRED', 'FAILED')
                AND COALESCE((plot_tenure_verification.parse_result->>'retryable')::boolean, false)
                THEN NULL
              ELSE plot_tenure_verification.parse_confidence
            END,
            updated_at = NOW()
        `,
        [plotId, storagePath, item.mimeType ?? null, item.label ?? null, evidenceDocumentId],
      );
    }
  }

  private async supersedePriorLandDocumentVerifications(
    plotId: string,
    activeStoragePath: string,
    evidenceKind: 'tenure_evidence' | 'land_title',
  ): Promise<void> {
    const res = await this.pool.query<{ id: string }>(
      `
        SELECT id::text
        FROM plot_tenure_verification
        WHERE plot_id = $1
          AND storage_path <> $2
          AND NOT COALESCE((parse_result->>'superseded')::boolean, false)
          AND (
            ($3 = 'land_title' AND (
              storage_path LIKE '%/land_title/%'
              OR evidence_label = 'land_title_photo'
            ))
            OR ($3 = 'tenure_evidence' AND storage_path LIKE '%/tenure_evidence/%')
          )
      `,
      [plotId, activeStoragePath, evidenceKind],
    );

    for (const row of res.rows) {
      await this.pool.query(
        `
          UPDATE plot_tenure_verification
          SET
            parse_result = COALESCE(parse_result, '{}'::jsonb) || jsonb_build_object(
              'superseded', true,
              'superseded_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              'superseded_by_storage_path', $2
            ),
            updated_at = NOW()
          WHERE id = $1::uuid
        `,
        [row.id, activeStoragePath],
      );
      await this.evidenceDocuments.resolveSupersededTenureVerification(row.id);
    }
  }

  async listForPlot(plotId: string): Promise<PlotTenureVerificationRow[]> {
    try {
      return await this.listForPlotQuery(plotId);
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  private async listForPlotQuery(plotId: string): Promise<PlotTenureVerificationRow[]> {
    const res = await this.pool.query(
      `
        SELECT
          id::text,
          plot_id::text,
          storage_path,
          mime_type,
          evidence_label,
          parse_status,
          parse_result,
          parse_confidence::float8,
          parse_reviewed_by::text,
          parse_reviewed_at::text,
          created_at::text,
          updated_at::text
        FROM plot_tenure_verification
        WHERE plot_id = $1
          AND NOT COALESCE((parse_result->>'superseded')::boolean, false)
        ORDER BY updated_at DESC
      `,
      [plotId],
    );

    return res.rows.map((row) => ({
      ...row,
      parse_confidence:
        row.parse_confidence != null && Number.isFinite(Number(row.parse_confidence))
          ? Number(row.parse_confidence)
          : null,
      parse_result: row.parse_result ?? null,
    }));
  }

  schedulePlotParseWorker(plotId: string): void {
    void this.processPendingForPlot(plotId).catch((error) => {
      this.logger.warn(`Tenure parse worker failed for plot ${plotId}: ${String(error)}`);
    });
  }

  private async processPendingForPlot(plotId: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE plot_tenure_verification
        SET
          parse_status = 'PENDING',
          parse_result = NULL,
          parse_confidence = NULL,
          updated_at = NOW()
        WHERE plot_id = $1
          AND parse_status = 'MANUAL_REQUIRED'
          AND COALESCE((parse_result->>'retryable')::boolean, false) = true
      `,
      [plotId],
    );

    const pending = await this.pool.query<{ id: string }>(
      `
        SELECT id::text
        FROM plot_tenure_verification
        WHERE plot_id = $1 AND parse_status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 5
      `,
      [plotId],
    );

    for (const row of pending.rows) {
      await this.processRecord(row.id);
    }
  }

  private async processRecord(recordId: string): Promise<void> {
    const claim = await this.pool.query<{
      id: string;
      plot_id: string;
      storage_path: string;
      mime_type: string | null;
      evidence_document_id: string | null;
    }>(
      `
        UPDATE plot_tenure_verification
        SET parse_status = 'IN_PROGRESS', updated_at = NOW()
        WHERE id = $1 AND parse_status = 'PENDING'
        RETURNING
          id::text,
          plot_id::text,
          storage_path,
          mime_type,
          evidence_document_id::text
      `,
      [recordId],
    );

    const row = claim.rows[0];
    if (!row) return;

    try {
      const documentSource = this.inferDocumentSource(row.storage_path);
      const parseResult = await this.extractTenureFields(
        row.storage_path,
        row.mime_type,
        documentSource === 'land_title',
      );
      const cadastralContext = await this.getPlotCadastralContext(row.plot_id);
      const withCrossCheck = applyCadastralCrossCheck(
        parseResult,
        cadastralContext,
        documentSource,
      );
      const evaluation = evaluateTenureParseResult(withCrossCheck);
      const parseResultWithParser: TenureParseResultV1 = {
        ...withCrossCheck,
        parser: withCrossCheck.parser ?? 'llm',
        document_source: documentSource,
      };

      await this.pool.query(
        `
          UPDATE plot_tenure_verification
          SET
            parse_status = $2,
            parse_result = $3::jsonb,
            parse_confidence = $4,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          recordId,
          evaluation.parse_status,
          JSON.stringify(parseResultWithParser),
          evaluation.parse_confidence,
        ],
      );

      await this.pool.query(
        `
          INSERT INTO audit_log (event_type, payload)
          VALUES ('tenure_parse_completed', $1::jsonb)
        `,
        [
          JSON.stringify({
            plotId: row.plot_id,
            verificationId: recordId,
            storagePath: row.storage_path,
            parse_status: evaluation.parse_status,
            parse_confidence: evaluation.parse_confidence,
            tenure_type: parseResultWithParser.tenure_type,
          }),
        ],
      );

      const tenantRes = row.evidence_document_id
        ? await this.pool.query<{ tenant_id: string | null }>(
            `SELECT tenant_id::text FROM evidence_documents WHERE id = $1`,
            [row.evidence_document_id],
          )
        : { rows: [{ tenant_id: null }] };

      await this.evidenceDocuments.syncParseOutcome({
        evidenceDocumentId: row.evidence_document_id,
        parseStatus: evaluation.parse_status,
        parseResult: parseResultWithParser,
        parseConfidence: evaluation.parse_confidence,
        plotId: row.plot_id,
        verificationId: recordId,
        tenantId: tenantRes.rows[0]?.tenant_id ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tenure parse failed';
      const retryable = isRetryableTenureParseFailure(message);
      const failedResult = {
        error: message,
        parser: 'llm',
        retryable,
      };
      const parseStatus = retryable ? 'MANUAL_REQUIRED' : 'FAILED';
      await this.pool.query(
        `
          UPDATE plot_tenure_verification
          SET
            parse_status = $2,
            parse_result = $3::jsonb,
            parse_confidence = 0,
            updated_at = NOW()
          WHERE id = $1
        `,
        [recordId, parseStatus, JSON.stringify(failedResult)],
      );

      const tenantRes = row.evidence_document_id
        ? await this.pool.query<{ tenant_id: string | null }>(
            `SELECT tenant_id::text FROM evidence_documents WHERE id = $1`,
            [row.evidence_document_id],
          )
        : { rows: [{ tenant_id: null }] };

      await this.evidenceDocuments.syncParseOutcome({
        evidenceDocumentId: row.evidence_document_id,
        parseStatus,
        parseResult: failedResult,
        parseConfidence: 0,
        plotId: row.plot_id,
        verificationId: recordId,
        tenantId: tenantRes.rows[0]?.tenant_id ?? null,
      });

      this.logger.warn(`Tenure parse record ${recordId} failed: ${message}`);
    }
  }

  async listReviewQueue(
    tenantId: string,
    canAccessPlot?: (plotId: string) => Promise<boolean>,
  ): Promise<TenureReviewQueueItem[]> {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return [];
    }

    try {
      const result = await this.pool.query(
        `
          SELECT
            ptv.id::text,
            ptv.plot_id::text,
            ptv.storage_path,
            ptv.mime_type,
            ptv.evidence_label,
            ptv.parse_status,
            ptv.parse_result,
            ptv.parse_confidence::float8,
            ptv.parse_reviewed_by::text,
            ptv.parse_reviewed_at::text,
            ptv.created_at::text,
            ptv.updated_at::text,
            p.name AS plot_name,
            p.farmer_id::text,
            COALESCE(ua.name, LEFT(fp.id::text, 8)) AS farmer_name,
            ci.id::text AS compliance_issue_id
          FROM plot_tenure_verification ptv
          JOIN plot p ON p.id = ptv.plot_id
          JOIN farmer_profile fp ON fp.id = p.farmer_id
          LEFT JOIN user_account ua ON ua.id = fp.user_id
          LEFT JOIN compliance_issues ci
            ON ci.linked_entity_type = 'tenure_verification'
           AND ci.linked_entity_id = ptv.id::text
           AND ci.status = 'open'
          WHERE p.farmer_id = ANY($1::uuid[])
            AND ptv.parse_status IN ('MANUAL_REQUIRED', 'FAILED')
          ORDER BY ptv.updated_at DESC
          LIMIT 100
        `,
        [farmerIds],
      );

      const scoped = canAccessPlot
        ? (
            await Promise.all(
              result.rows.map(async (row) => ({
                row,
                allowed: await canAccessPlot(row.plot_id as string),
              })),
            )
          )
            .filter((entry) => entry.allowed)
            .map((entry) => entry.row)
        : result.rows;

      return scoped.map((row) => ({
        id: row.id,
        plot_id: row.plot_id,
        storage_path: row.storage_path,
        mime_type: row.mime_type,
        evidence_label: row.evidence_label,
        parse_status: row.parse_status,
        parse_result: row.parse_result ?? null,
        parse_confidence:
          row.parse_confidence != null && Number.isFinite(Number(row.parse_confidence))
            ? Number(row.parse_confidence)
            : null,
        parse_reviewed_by: row.parse_reviewed_by,
        parse_reviewed_at: row.parse_reviewed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        plot_name: row.plot_name ?? null,
        farmer_id: row.farmer_id,
        farmer_name: row.farmer_name ?? null,
        compliance_issue_id: row.compliance_issue_id ?? null,
      }));
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async confirmTenureReview(params: {
    plotId: string;
    verificationId: string;
    userId: string;
    reason: string;
    note?: string | null;
  }): Promise<PlotTenureVerificationRow> {
    const reason = params.reason?.trim() ?? '';
    if (reason.length < 8) {
      throw new BadRequestException('Reason must be at least 8 characters');
    }

    const current = await this.pool.query<{
      id: string;
      plot_id: string;
      parse_status: TenureParseStatus;
      parse_result: Record<string, unknown> | null;
      evidence_document_id: string | null;
    }>(
      `
        SELECT
          id::text,
          plot_id::text,
          parse_status,
          parse_result,
          evidence_document_id::text
        FROM plot_tenure_verification
        WHERE id = $1 AND plot_id = $2
      `,
      [params.verificationId, params.plotId],
    );

    const row = current.rows[0];
    if (!row) {
      throw new NotFoundException('Tenure verification record not found');
    }
    if (row.parse_status !== 'MANUAL_REQUIRED' && row.parse_status !== 'FAILED') {
      throw new BadRequestException('Only manual or failed tenure reviews can be confirmed');
    }

    const reviewedResult = {
      ...(row.parse_result ?? {}),
      human_review: {
        confirmed_by: params.userId,
        confirmed_at: new Date().toISOString(),
        reason,
        note: params.note ?? null,
      },
    };

    await this.pool.query(
      `
        UPDATE plot_tenure_verification
        SET
          parse_status = 'COMPLETED',
          parse_result = $2::jsonb,
          parse_reviewed_by = $3::uuid,
          parse_reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [params.verificationId, JSON.stringify(reviewedResult), params.userId],
    );

    await this.evidenceDocuments.markHumanReview({
      evidenceDocumentId: row.evidence_document_id,
      userId: params.userId,
      note: params.note ?? null,
      plotId: params.plotId,
      verificationId: params.verificationId,
    });

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, 'tenure_parse_reviewed', $2::jsonb)
      `,
      [
        params.userId,
        JSON.stringify({
          plotId: params.plotId,
          verificationId: params.verificationId,
          reason,
          note: params.note ?? null,
        }),
      ],
    );

    const rows = await this.listForPlot(params.plotId);
    const updated = rows.find((entry) => entry.id === params.verificationId);
    if (!updated) {
      throw new NotFoundException('Updated tenure verification not found');
    }
    return updated;
  }

  private inferDocumentSource(storagePath: string): TenureDocumentSource {
    const normalized = storagePath.toLowerCase();
    return normalized.includes('/land_title/') ? 'land_title' : 'tenure_evidence';
  }

  private async getPlotCadastralContext(
    plotId: string,
  ): Promise<PlotCadastralContext> {
    const legalRes = await this.pool.query<{
      cadastral_key: string | null;
      informal_tenure: boolean | null;
    }>(
      `
        SELECT
          NULLIF(payload ->> 'cadastralKey', '') AS cadastral_key,
          CASE
            WHEN (payload ->> 'informalTenure')::boolean IS TRUE THEN TRUE
            ELSE FALSE
          END AS informal_tenure
        FROM audit_log
        WHERE event_type = 'plot_legal_synced'
          AND payload ->> 'plotId' = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [plotId],
    );

    const farmerRes = await this.pool.query<{
      farmer_name: string | null;
      country_code: string | null;
    }>(
      `
        SELECT
          COALESCE(ua.name, LEFT(fp.id::text, 8)) AS farmer_name,
          NULLIF(TRIM(fp.country_code), '') AS country_code
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        WHERE p.id = $1
      `,
      [plotId],
    );

    const farmerName = farmerRes.rows[0]?.farmer_name?.trim() || null;

    return {
      declaredCadastralKey: legalRes.rows[0]?.cadastral_key ?? null,
      informalTenure: legalRes.rows[0]?.informal_tenure === true,
      farmerName,
      countryCode: farmerRes.rows[0]?.country_code ?? null,
    };
  }

  private async extractTenureFields(
    storagePath: string,
    mimeType: string | null,
    formalCadastral = false,
  ): Promise<TenureParseResultV1> {
    const llmConfig = resolveTenureParseLlmConfig();
    if (!llmConfig) {
      return this.stubManualRequiredResult(
        'Configure AI_GATEWAY_API_KEY (recommended) or OPENAI_API_KEY for automated tenure extraction.',
      );
    }

    const privacyWarning = tenureParsePrivacyWarning(llmConfig);
    if (privacyWarning) {
      this.logger.warn(privacyWarning);
    }

    const fileBytes = await this.downloadEvidenceFile(storagePath);
    const mime = mimeType?.trim() || this.guessMimeFromPath(storagePath);
    const llmResult = await this.callVisionLlm(fileBytes, mime, llmConfig, formalCadastral);
    return { ...llmResult, parser: 'llm' };
  }

  private stubManualRequiredResult(summary: string): TenureParseResultV1 {
    return {
      tenure_type: 'UNKNOWN',
      holder_name: null,
      community_or_issuer: null,
      parcel_reference: null,
      title_number: null,
      issue_date: null,
      country_iso: null,
      clauses_found: [],
      clauses_missing: ['automated_extraction_unavailable'],
      anti_fraud: {
        metadata_timestamp_plausible: true,
        issuer_name_match: true,
        document_age_within_policy: true,
      },
      confidence_breakdown: { ocr_quality: 0, field_completeness: 0 },
      summary,
      parser: 'manual_required_stub',
    };
  }

  private async downloadEvidenceFile(storagePath: string): Promise<Buffer> {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase storage is not configured for tenure parse downloads.');
    }

    const bucket = process.env.EVIDENCE_STORAGE_BUCKET?.trim() || 'plot-evidence';
    const normalized = storagePath.trim().replace(/^\/+/, '');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.storage.from(bucket).download(normalized);
    if (error || !data) {
      throw new Error(error?.message ?? 'Could not download tenure evidence file.');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private guessMimeFromPath(storagePath: string): string {
    const lower = storagePath.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    return 'application/octet-stream';
  }

  private async callVisionLlm(
    fileBytes: Buffer,
    mimeType: string,
    llmConfig: NonNullable<ReturnType<typeof resolveTenureParseLlmConfig>>,
    formalCadastral = false,
  ): Promise<TenureParseResultV1> {
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    if (!isImage && !isPdf) {
      return this.stubManualRequiredResult(`Unsupported mime type for vision parse: ${mimeType}`);
    }

    const dataUrl = `data:${mimeType};base64,${fileBytes.toString('base64')}`;
    const userContent: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text: formalCadastral
          ? 'Extract formal land title and Clave Catastral fields from this document for EUDR due diligence.'
          : 'Extract land tenure fields from this farmer document for EUDR due diligence.',
      },
      {
        type: 'image_url',
        image_url: { url: dataUrl },
      },
    ];

    const requestBody = buildTenureParseRequestBody({
      config: llmConfig,
      systemPrompt: formalCadastral
        ? FORMAL_CADASTRAL_PARSE_SYSTEM_PROMPT
        : TENURE_PARSE_SYSTEM_PROMPT,
      userContent,
    });

    const response = await fetch(llmConfig.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${llmConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`LLM tenure parse failed (${response.status}): ${body.slice(0, 240)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM tenure parse returned empty content.');
    }

    return this.normalizeLlmJson(content);
  }

  private normalizeLlmJson(raw: string): TenureParseResultV1 {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(extractJsonFromLlmContent(raw)) as Record<string, unknown>;
    } catch {
      throw new Error('LLM tenure parse returned invalid JSON.');
    }

    const tenureTypeRaw = parsed.tenure_type;
    const tenure_type: TenureType =
      tenureTypeRaw === 'FORMAL' ||
      tenureTypeRaw === 'CUSTOMARY' ||
      tenureTypeRaw === 'LEASEHOLD' ||
      tenureTypeRaw === 'POSSESSION_DECLARATION'
        ? tenureTypeRaw
        : 'UNKNOWN';

    const antiFraud = (parsed.anti_fraud as Record<string, unknown>) ?? {};
    const confidence = (parsed.confidence_breakdown as Record<string, unknown>) ?? {};

    return {
      tenure_type,
      holder_name: typeof parsed.holder_name === 'string' ? parsed.holder_name : null,
      community_or_issuer:
        typeof parsed.community_or_issuer === 'string' ? parsed.community_or_issuer : null,
      parcel_reference:
        typeof parsed.parcel_reference === 'string' ? parsed.parcel_reference : null,
      title_number: typeof parsed.title_number === 'string' ? parsed.title_number : null,
      issue_date: typeof parsed.issue_date === 'string' ? parsed.issue_date : null,
      country_iso: typeof parsed.country_iso === 'string' ? parsed.country_iso : null,
      clauses_found: Array.isArray(parsed.clauses_found)
        ? parsed.clauses_found.filter((v): v is string => typeof v === 'string')
        : [],
      clauses_missing: Array.isArray(parsed.clauses_missing)
        ? parsed.clauses_missing.filter((v): v is string => typeof v === 'string')
        : [],
      anti_fraud: {
        metadata_timestamp_plausible: antiFraud.metadata_timestamp_plausible !== false,
        issuer_name_match: antiFraud.issuer_name_match !== false,
        document_age_within_policy: antiFraud.document_age_within_policy !== false,
      },
      confidence_breakdown: {
        ocr_quality:
          typeof confidence.ocr_quality === 'number'
            ? Math.max(0, Math.min(1, confidence.ocr_quality))
            : 0.5,
        field_completeness:
          typeof confidence.field_completeness === 'number'
            ? Math.max(0, Math.min(1, confidence.field_completeness))
            : 0.5,
      },
      summary: typeof parsed.summary === 'string' ? parsed.summary : null,
      parser: 'llm',
    };
  }
}

export function summarizeTenureParseStatus(
  rows: PlotTenureVerificationRow[],
): TenureParseStatus | null {
  if (rows.length === 0) return null;
  const priority: TenureParseStatus[] = [
    'FAILED',
    'MANUAL_REQUIRED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
  ];
  for (const status of priority) {
    if (rows.some((row) => row.parse_status === status)) return status;
  }
  return rows[0]?.parse_status ?? null;
}
