import { Inject, Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { evaluateTenureParseResult } from './tenure-parse.evaluator';
import {
  buildTenureParseRequestBody,
  resolveTenureParseLlmConfig,
  tenureParsePrivacyWarning,
} from './tenure-parse.gateway';
import type {
  PlotTenureVerificationRow,
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
List missing legal elements in clauses_missing. Be conservative: if unreadable, lower confidence and list gaps.`;

@Injectable()
export class TenureParseService {
  private readonly logger = new Logger(TenureParseService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async enqueueFromEvidenceSync(
    plotId: string,
    kind: string,
    items: EvidenceSyncItem[],
  ): Promise<void> {
    if (kind !== 'tenure_evidence') return;

    const withFiles = items.filter(
      (item) => typeof item.storagePath === 'string' && item.storagePath.trim().length > 0,
    );
    if (withFiles.length === 0) return;

    try {
      await this.enqueueItems(plotId, withFiles);
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

  private async enqueueItems(plotId: string, withFiles: EvidenceSyncItem[]): Promise<void> {
    for (const item of withFiles) {
      const storagePath = item.storagePath!.trim();
      await this.pool.query(
        `
          INSERT INTO plot_tenure_verification (
            plot_id, storage_path, mime_type, evidence_label, parse_status
          )
          VALUES ($1, $2, $3, $4, 'PENDING')
          ON CONFLICT (plot_id, storage_path) DO UPDATE SET
            mime_type = COALESCE(EXCLUDED.mime_type, plot_tenure_verification.mime_type),
            evidence_label = COALESCE(EXCLUDED.evidence_label, plot_tenure_verification.evidence_label),
            parse_status = CASE
              WHEN plot_tenure_verification.parse_status IN ('COMPLETED', 'MANUAL_REQUIRED')
                THEN plot_tenure_verification.parse_status
              ELSE 'PENDING'
            END,
            updated_at = NOW()
        `,
        [plotId, storagePath, item.mimeType ?? null, item.label ?? null],
      );
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

  private async processPendingForPlot(plotId: string): Promise<void> {
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
    }>(
      `
        UPDATE plot_tenure_verification
        SET parse_status = 'IN_PROGRESS', updated_at = NOW()
        WHERE id = $1 AND parse_status = 'PENDING'
        RETURNING id::text, plot_id::text, storage_path, mime_type
      `,
      [recordId],
    );

    const row = claim.rows[0];
    if (!row) return;

    try {
      const parseResult = await this.extractTenureFields(row.storage_path, row.mime_type);
      const evaluation = evaluateTenureParseResult(parseResult);
      const parseResultWithParser: TenureParseResultV1 = {
        ...parseResult,
        parser: parseResult.parser ?? 'llm',
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tenure parse failed';
      await this.pool.query(
        `
          UPDATE plot_tenure_verification
          SET
            parse_status = 'FAILED',
            parse_result = $2::jsonb,
            parse_confidence = 0,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          recordId,
          JSON.stringify({
            error: message,
            parser: 'llm',
          }),
        ],
      );
      this.logger.warn(`Tenure parse record ${recordId} failed: ${message}`);
    }
  }

  private async extractTenureFields(
    storagePath: string,
    mimeType: string | null,
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
    const llmResult = await this.callVisionLlm(fileBytes, mime, llmConfig);
    return { ...llmResult, parser: 'llm' };
  }

  private stubManualRequiredResult(summary: string): TenureParseResultV1 {
    return {
      tenure_type: 'UNKNOWN',
      holder_name: null,
      community_or_issuer: null,
      parcel_reference: null,
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
        text: 'Extract land tenure fields from this farmer document for EUDR due diligence.',
      },
      {
        type: 'image_url',
        image_url: { url: dataUrl },
      },
    ];

    const requestBody = buildTenureParseRequestBody({
      config: llmConfig,
      systemPrompt: TENURE_PARSE_SYSTEM_PROMPT,
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
      parsed = JSON.parse(raw) as Record<string, unknown>;
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
