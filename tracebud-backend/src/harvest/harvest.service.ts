import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { CreateDdsPackageDto } from './dto/create-dds-package.dto';
import {
  DdsPackageEvidenceDocumentDto,
  DdsPackageEvidenceDocumentReviewStatus,
  DdsPackageEvidenceDocumentType,
} from './dto/dds-package-evidence-document.dto';

const YIELD_CAP_KG_PER_HA = 1500;

export interface ReadinessIssue {
  code: string;
  message: string;
  severity: 'blocker' | 'warning';
}

export interface DdsPackageReadinessResult {
  packageId: string;
  status: 'blocked' | 'warning_review' | 'ready_to_submit';
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
  checkedAt: string;
}

export type DdsPackageReadinessAuditPhase =
  | 'requested'
  | 'evaluated'
  | 'blocked'
  | 'warning'
  | 'passed';

export interface DdsPackageRiskScoreReason {
  code: string;
  message: string;
  weight: number;
}

export interface DdsPackageRiskScoreResult {
  packageId: string;
  provider: 'internal_v1';
  score: number;
  band: 'low' | 'medium' | 'high';
  reasons: DdsPackageRiskScoreReason[];
  scoredAt: string;
}

export interface DdsPackageFilingPreflightResult {
  packageId: string;
  status: 'preflight_blocked' | 'preflight_ready';
  readinessStatus: DdsPackageReadinessResult['status'];
  riskBand: DdsPackageRiskScoreResult['band'];
  riskScore: number;
  blockerCount: number;
  warningCount: number;
  checkedAt: string;
}

export interface DdsPackageGenerationResult {
  packageId: string;
  status: 'package_generated';
  artifactVersion: 'v1';
  lotCount: number;
  generatedAt: string;
}

export interface SubmitDdsPackageResult {
  packageId: string;
  idempotencyKey: string;
  status: 'submitted';
  submissionState: 'submitted';
  tracesReference: string;
  replayed: boolean;
  persistedAt: string;
}

export type DdsPackageEvidenceDocument = DdsPackageEvidenceDocumentDto;

export type DdsPackageRiskScoreAuditPhase = 'requested' | 'evaluated' | 'low' | 'medium' | 'high';
interface DdsPackageRiskScoreAuditContext {
  tenantId: string;
  userId?: string | null;
  exportedBy?: string | null;
}
type DdsPackageFilingPreflightAuditPhase = 'requested' | 'evaluated' | 'blocked' | 'ready';
type DdsPackageGenerationAuditPhase = 'requested' | 'generated';
type DdsPackageSubmissionAuditPhase = 'requested' | 'accepted' | 'replayed';

@Injectable()
export class HarvestService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(dto: CreateHarvestDto, userId: string | undefined) {
    const { farmerId, plotId, kg, harvestDate, note, hlcTimestamp, clientEventId } = dto;

    if (kg <= 0) {
      throw new BadRequestException('Kg must be positive');
    }

    const plotRes = await this.pool.query(
      'SELECT id, area_ha, sinaph_overlap, indigenous_overlap FROM plot WHERE id = $1 AND farmer_id = $2',
      [plotId, farmerId],
    );
    if (plotRes.rowCount === 0) {
      throw new BadRequestException('Plot does not belong to farmer');
    }

    const areaHa = Number(plotRes.rows[0].area_ha);
    const sinaphOverlap = plotRes.rows[0].sinaph_overlap === true;
    const indigenousOverlap = plotRes.rows[0].indigenous_overlap === true;

    // If overlap-flagged, require an explicit override reason and the required evidence synced.
    if (sinaphOverlap || indigenousOverlap) {
      const trimmedNote = (note ?? '').trim();
      if (!trimmedNote || !trimmedNote.toUpperCase().includes('AMBER_OVERRIDE')) {
        throw new BadRequestException(
          'Overlap-flagged plot: note with AMBER_OVERRIDE reason is required to record harvest',
        );
      }

      const requiredKinds: string[] = [];
      if (indigenousOverlap) requiredKinds.push('fpic_repository');
      if (sinaphOverlap) requiredKinds.push('protected_area_permit');

      for (const kind of requiredKinds) {
        const evRes = await this.pool.query(
          `
            SELECT 1
            FROM audit_log
            WHERE event_type = 'plot_evidence_synced'
              AND payload ->> 'plotId' = $1
              AND payload ->> 'kind' = $2
            LIMIT 1
          `,
          [plotId, kind],
        );
        if (evRes.rowCount === 0) {
          throw new BadRequestException(
            `Overlap-flagged plot: required evidence not synced (${kind}). Sync evidence metadata before recording harvest.`,
          );
        }
      }
    }
    if (areaHa > 0) {
      const capKg = areaHa * YIELD_CAP_KG_PER_HA;
      if (kg > capKg) {
        throw new BadRequestException(
          `Yield cap exceeded: ${kg.toFixed(
            1,
          )}kg > ${capKg.toFixed(1)}kg allowed for ${areaHa.toFixed(4)}ha plot`,
        );
      }
    }

    const insertRes = await this.pool.query(
      `
        INSERT INTO harvest_transaction (
          farmer_id,
          plot_id,
          kg,
          harvest_date,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [farmerId, plotId, kg, harvestDate ?? null, null],
    );

    const tx = insertRes.rows[0];

    const qrRef = `V-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const voucherRes = await this.pool.query(
      `
        INSERT INTO voucher (
          farmer_id,
          transaction_id,
          qr_code_ref
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [farmerId, tx.id, qrRef],
    );

    const result = {
      transaction: tx,
      voucher: voucherRes.rows[0],
    };

    // Audit: harvest recorded
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'harvest_recorded',
        JSON.stringify({
          farmerId,
          plotId,
          kg,
          harvestId: tx.id,
          voucherId: voucherRes.rows[0].id,
          note: note ?? null,
          hlcTimestamp: hlcTimestamp ?? null,
          clientEventId: clientEventId ?? null,
        }),
      ],
    );

    return result;
  }

  async listVouchersForFarmer(farmerId: string) {
    const res = await this.pool.query(
      `
        SELECT
          v.id,
          v.farmer_id,
          v.transaction_id,
          v.qr_code_ref,
          v.status,
          v.created_at,
          tx.plot_id,
          tx.kg
        FROM voucher v
        LEFT JOIN harvest_transaction tx ON tx.id = v.transaction_id
        WHERE v.farmer_id = $1
        ORDER BY v.created_at DESC
      `,
      [farmerId],
    );

    return res.rows;
  }

  async isFarmerOwnedByUser(farmerId: string, userId: string): Promise<boolean> {
    const res = await this.pool.query(
      `
        SELECT 1
        FROM farmer_profile
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [farmerId, userId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getVoucherByQrRef(qrRef: string) {
    const trimmed = (qrRef ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('qrRef is required');
    }

    const res = await this.pool.query(
      `
        SELECT
          v.id,
          v.farmer_id,
          v.transaction_id,
          v.qr_code_ref,
          v.status,
          v.created_at,
          dpv.dds_package_id,
          dp.status as dds_status,
          dp.traces_reference
        FROM voucher v
        LEFT JOIN dds_package_voucher dpv ON dpv.voucher_id = v.id
        LEFT JOIN dds_package dp ON dp.id = dpv.dds_package_id
        WHERE v.qr_code_ref = $1
        LIMIT 1
      `,
      [trimmed],
    );

    if (res.rowCount === 0) {
      throw new BadRequestException('Voucher not found for given qrRef');
    }

    const row = res.rows[0] as any;

    return {
      voucher: {
        id: row.id,
        farmerId: row.farmer_id,
        transactionId: row.transaction_id,
        qrRef: row.qr_code_ref,
        status: row.status,
        createdAt: row.created_at,
      },
      ddsPackage: row.dds_package_id
        ? {
            id: row.dds_package_id,
            status: row.dds_status,
            tracesReference: row.traces_reference ?? null,
          }
        : null,
    };
  }

  async createDdsPackage(dto: CreateDdsPackageDto) {
    const { voucherIds, label } = dto;

    const vouchersRes = await this.pool.query(
      `
        SELECT id, farmer_id
        FROM voucher
        WHERE id = ANY($1::uuid[])
      `,
      [voucherIds],
    );

    if (vouchersRes.rowCount === 0) {
      throw new BadRequestException('No vouchers found for given IDs');
    }

    const farmerId = vouchersRes.rows[0].farmer_id as string;

    const pkgRes = await this.pool.query(
      `
        INSERT INTO dds_package (
          farmer_id,
          label,
          status
        )
        VALUES ($1, $2, 'draft')
        RETURNING *
      `,
      [farmerId, label ?? null],
    );

    const pkg = pkgRes.rows[0];

    await this.pool.query(
      `
        INSERT INTO dds_package_voucher (dds_package_id, voucher_id)
        SELECT $1::uuid, id
        FROM voucher
        WHERE id = ANY($2::uuid[])
      `,
      [pkg.id, voucherIds],
    );

    return pkg;
  }

  async listDdsPackagesForFarmer(farmerId: string) {
    const res = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          label,
          status,
          created_at
        FROM dds_package
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    return res.rows;
  }

  async getDdsPackageDetail(id: string) {
    const pkgRes = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          label,
          status,
          created_at,
          traces_reference
        FROM dds_package
        WHERE id = $1
      `,
      [id],
    );

    if (pkgRes.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }

    const vouchersRes = await this.pool.query(
      `
        SELECT
          v.id,
          v.status,
          v.created_at,
          ht.kg,
          ht.harvest_date,
          p.id as plot_id,
          p.name as plot_name,
          p.kind as plot_kind,
          p.area_ha,
          p.declared_area_ha
        FROM dds_package_voucher dpv
        JOIN voucher v ON v.id = dpv.voucher_id
        JOIN harvest_transaction ht ON ht.id = v.transaction_id
        JOIN plot p ON p.id = ht.plot_id
        WHERE dpv.dds_package_id = $1
        ORDER BY v.created_at DESC
      `,
      [id],
    );

    return {
      package: pkgRes.rows[0],
      vouchers: vouchersRes.rows,
    };
  }

  async getDdsPackageTracesJson(id: string) {
    const detail = await this.getDdsPackageDetail(id);
    const pkg = detail.package as any;
    const vouchers = detail.vouchers as any[];

    const exporterId = pkg.farmer_id;

    const lots = vouchers.map((v) => ({
      voucherId: v.id,
      plotId: v.plot_id,
      plotName: v.plot_name,
      plotKind: v.plot_kind,
      plotAreaHa: Number(v.area_ha),
      declaredAreaHa: v.declared_area_ha != null ? Number(v.declared_area_ha) : null,
      kg: Number(v.kg),
      harvestDate: v.harvest_date
        ? new Date(v.harvest_date).toISOString().slice(0, 10)
        : null,
    }));

    const totalKg = lots.reduce((sum, lot) => sum + (Number.isFinite(lot.kg) ? lot.kg : 0), 0);

    return {
      tracesReference: pkg.traces_reference ?? null,
      exporterId,
      ddsPackageId: pkg.id,
      label: pkg.label ?? null,
      createdAt: pkg.created_at,
      status: pkg.status,
      commodity: 'coffee',
      hsCode: '0901',
      totalKg,
      lots,
    };
  }

  async generateDdsPackageArtifacts(
    id: string,
    context: DdsPackageRiskScoreAuditContext,
  ): Promise<DdsPackageGenerationResult> {
    await this.appendPackageGenerationAuditEvent(id, context, 'requested');
    const preflight = await this.evaluateDdsPackageFilingPreflight(id, context);
    if (preflight.status === 'preflight_blocked') {
      throw new BadRequestException('Filing preflight is blocked for this package');
    }

    const detail = await this.getDdsPackageDetail(id);
    const lotCount = Array.isArray(detail.vouchers) ? detail.vouchers.length : 0;
    const pkgRes = await this.pool.query(
      `
        UPDATE dds_package
        SET status = 'package_generated'
        WHERE id = $1
        RETURNING id
      `,
      [id],
    );
    if (pkgRes.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }
    const result: DdsPackageGenerationResult = {
      packageId: id,
      status: 'package_generated',
      artifactVersion: 'v1',
      lotCount,
      generatedAt: new Date().toISOString(),
    };
    await this.appendPackageGenerationAuditEvent(id, context, 'generated', result);
    return result;
  }

  async submitDdsPackage(
    id: string,
    idempotencyKey: string,
    context: DdsPackageRiskScoreAuditContext,
  ): Promise<SubmitDdsPackageResult> {
    const key = String(idempotencyKey ?? '').trim();
    if (!key) {
      throw new BadRequestException('idempotencyKey is required');
    }
    await this.appendPackageSubmissionAuditEvent(id, key, context, 'requested');

    const replayRes = await this.pool.query<{ payload: any; timestamp: string }>(
      `
        SELECT payload, timestamp
        FROM audit_log
        WHERE event_type IN ('dds_package_submission_accepted', 'dds_package_submission_replayed')
          AND payload ->> 'packageId' = $1
          AND payload ->> 'idempotencyKey' = $2
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [id, key],
    );
    if ((replayRes.rowCount ?? 0) > 0) {
      const payload = replayRes.rows[0]?.payload ?? {};
      const replayed: SubmitDdsPackageResult = {
        packageId: id,
        idempotencyKey: key,
        status: 'submitted',
        submissionState: 'submitted',
        tracesReference: String(payload.tracesReference ?? ''),
        replayed: true,
        persistedAt: new Date(replayRes.rows[0].timestamp).toISOString(),
      };
      await this.appendPackageSubmissionAuditEvent(id, key, context, 'replayed', replayed);
      return replayed;
    }

    const inflightRes = await this.pool.query(
      `
        UPDATE dds_package
        SET status = 'submission_inflight'
        WHERE id = $1
        RETURNING id, traces_reference
      `,
      [id],
    );
    if (inflightRes.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }
    const tracesRef =
      inflightRes.rows[0]?.traces_reference ??
      `TRACES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const res = await this.pool.query(
      `
        UPDATE dds_package
        SET status = 'submitted',
            traces_reference = $2
        WHERE id = $1
        RETURNING id, traces_reference
      `,
      [id, tracesRef],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('DDS package not found');
    }
    const result: SubmitDdsPackageResult = {
      packageId: id,
      idempotencyKey: key,
      status: 'submitted',
      submissionState: 'submitted',
      tracesReference: String(res.rows[0].traces_reference),
      replayed: false,
      persistedAt: new Date().toISOString(),
    };
    await this.appendPackageSubmissionAuditEvent(id, key, context, 'accepted', result);
    return result;
  }

  async evaluateDdsPackageReadiness(id: string): Promise<DdsPackageReadinessResult> {
    await this.appendReadinessAuditEvent(id, 'requested');
    const detail = await this.getDdsPackageDetail(id);
    const pkg = detail.package as any;
    const vouchers = Array.isArray(detail.vouchers) ? detail.vouchers : [];

    const blockers: ReadinessIssue[] = [];
    const warnings: ReadinessIssue[] = [];

    if (vouchers.length === 0) {
      blockers.push({
        code: 'RULE-MISSING-VOUCHERS',
        severity: 'blocker',
        message: 'DDS package has no linked vouchers.',
      });
    }

    if (
      vouchers.some(
        (voucher: any) =>
          typeof voucher.kg !== 'number' || !Number.isFinite(voucher.kg) || voucher.kg <= 0,
      )
    ) {
      blockers.push({
        code: 'RULE-INVALID-VOUCHER-WEIGHT',
        severity: 'blocker',
        message: 'One or more vouchers has missing or non-positive kg values.',
      });
    }

    if (vouchers.some((voucher: any) => !voucher.harvest_date)) {
      warnings.push({
        code: 'RULE-MISSING-HARVEST-DATE',
        severity: 'warning',
        message: 'One or more vouchers is missing harvest_date.',
      });
    }

    if (
      vouchers.some(
        (voucher: any) =>
          voucher.declared_area_ha === null ||
          voucher.declared_area_ha === undefined ||
          Number.isNaN(Number(voucher.declared_area_ha)),
      )
    ) {
      warnings.push({
        code: 'RULE-MISSING-DECLARED-AREA',
        severity: 'warning',
        message: 'One or more vouchers is missing declared plot area.',
      });
    }

    for (const reason of this.evaluateComplianceDocumentReasons(vouchers)) {
      if (reason.severity === 'blocker') {
        blockers.push(reason);
      } else {
        warnings.push(reason);
      }
    }

    const status: DdsPackageReadinessResult['status'] =
      blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning_review' : 'ready_to_submit';

    const result = {
      packageId: pkg.id,
      status,
      blockers,
      warnings,
      checkedAt: new Date().toISOString(),
    };
    await this.appendReadinessAuditEvent(id, 'evaluated', result);
    if (status === 'blocked') {
      await this.appendReadinessAuditEvent(id, 'blocked', result);
    } else if (status === 'warning_review') {
      await this.appendReadinessAuditEvent(id, 'warning', result);
    } else {
      await this.appendReadinessAuditEvent(id, 'passed', result);
    }
    return result;
  }

  async listDdsPackageEvidenceDocuments(id: string): Promise<DdsPackageEvidenceDocument[]> {
    const detail = await this.getDdsPackageDetail(id);
    const vouchers = Array.isArray(detail.vouchers) ? detail.vouchers : [];

    return vouchers.map((voucher: any, index: number) => {
      const statusRaw = String(voucher?.status ?? '').toLowerCase();
      const reviewStatus: DdsPackageEvidenceDocument['reviewStatus'] = statusRaw.includes('rejected')
        ? DdsPackageEvidenceDocumentReviewStatus.REJECTED
        : statusRaw.includes('pending')
          ? DdsPackageEvidenceDocumentReviewStatus.PENDING
          : DdsPackageEvidenceDocumentReviewStatus.VERIFIED;
      return {
        evidenceId: `evidence_${voucher?.id ?? index + 1}`,
        packageId: id,
        plotId: voucher?.plot_id ?? null,
        title: voucher?.plot_name
          ? `${voucher.plot_name} document packet`
          : `Voucher ${voucher?.id ?? index + 1} document packet`,
        type:
          voucher?.declared_area_ha === null || voucher?.declared_area_ha === undefined
            ? DdsPackageEvidenceDocumentType.TENURE_EVIDENCE
            : DdsPackageEvidenceDocumentType.LABOR_EVIDENCE,
        reviewStatus,
        source: String(voucher?.plot_name ?? ''),
        capturedAt: voucher?.harvest_date ?? voucher?.created_at ?? null,
      };
    });
  }

  private evaluateComplianceDocumentReasons(vouchers: any[]): ReadinessIssue[] {
    const reasons: ReadinessIssue[] = [];
    const now = new Date();

    for (const voucher of vouchers) {
      const status = String(voucher?.status ?? '').toLowerCase();
      const harvestDate = voucher?.harvest_date ? new Date(voucher.harvest_date) : null;
      const source = String(voucher?.plot_name ?? '').trim();
      const hasDeclaredArea =
        voucher?.declared_area_ha !== null &&
        voucher?.declared_area_ha !== undefined &&
        !Number.isNaN(Number(voucher.declared_area_ha));

      if (!hasDeclaredArea) {
        reasons.push({
          code: 'DOC_MISSING',
          severity: 'warning',
          message: 'Required declared-area evidence is missing for one or more voucher-linked plots.',
        });
      }

      if (status.includes('pending')) {
        reasons.push({
          code: 'DOC_PENDING_REVIEW',
          severity: 'warning',
          message: 'One or more voucher-linked evidence records is still pending review.',
        });
      }

      if (status.includes('rejected')) {
        reasons.push({
          code: 'DOC_REJECTED',
          severity: 'blocker',
          message: 'One or more voucher-linked evidence records was rejected.',
        });
      }

      if (!source) {
        reasons.push({
          code: 'DOC_SOURCE_MISSING',
          severity: 'warning',
          message: 'One or more voucher-linked evidence records is missing source attribution.',
        });
      }

      if (harvestDate && !Number.isNaN(harvestDate.getTime())) {
        const ageDays = Math.floor((now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays > 365) {
          reasons.push({
            code: 'DOC_STALE',
            severity: 'warning',
            message: 'One or more voucher-linked evidence records is older than 365 days.',
          });
        }
      }
    }

    const dedup = new Map<string, ReadinessIssue>();
    for (const reason of reasons) {
      if (!dedup.has(reason.code)) {
        dedup.set(reason.code, reason);
      }
    }
    return [...dedup.values()];
  }

  private async appendReadinessAuditEvent(
    packageId: string,
    phase: DdsPackageReadinessAuditPhase,
    result?: DdsPackageReadinessResult,
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          null,
          `dds_package_readiness_${phase}`,
          JSON.stringify({
            packageId,
            status: result?.status ?? null,
            blockerCount: result?.blockers.length ?? null,
            warningCount: result?.warnings.length ?? null,
            checkedAt: result?.checkedAt ?? null,
          }),
        ],
      );
    } catch {
      // Readiness evaluation should not fail because audit append failed.
    }
  }

  async evaluateDdsPackageRiskScore(id: string, context: DdsPackageRiskScoreAuditContext): Promise<DdsPackageRiskScoreResult> {
    await this.appendRiskScoreAuditEvent(id, 'requested', context);
    const detail = await this.getDdsPackageDetail(id);
    const pkg = detail.package as any;
    const vouchers = Array.isArray(detail.vouchers) ? detail.vouchers : [];

    const reasons: DdsPackageRiskScoreReason[] = [];
    let score = 0;

    if (vouchers.length === 0) {
      reasons.push({
        code: 'RISK-NO-VOUCHERS',
        message: 'Package has no vouchers linked.',
        weight: 70,
      });
      score += 70;
    }

    if (
      vouchers.some((voucher: any) => voucher.declared_area_ha === null || voucher.declared_area_ha === undefined)
    ) {
      reasons.push({
        code: 'RISK-MISSING-DECLARED-AREA',
        message: 'One or more vouchers is missing declared area.',
        weight: 15,
      });
      score += 15;
    }

    if (vouchers.some((voucher: any) => !voucher.harvest_date)) {
      reasons.push({
        code: 'RISK-MISSING-HARVEST-DATE',
        message: 'One or more vouchers is missing harvest_date.',
        weight: 10,
      });
      score += 10;
    }

    const totalKg = vouchers.reduce((acc: number, voucher: any) => acc + Number(voucher.kg ?? 0), 0);
    const totalArea = vouchers.reduce((acc: number, voucher: any) => acc + Number(voucher.area_ha ?? 0), 0);
    if (totalArea > 0) {
      const density = totalKg / totalArea;
      if (density > YIELD_CAP_KG_PER_HA) {
        reasons.push({
          code: 'RISK-HIGH-YIELD-DENSITY',
          message: 'Aggregated yield density exceeds benchmark cap.',
          weight: 35,
        });
        score += 35;
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const band: DdsPackageRiskScoreResult['band'] = score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low';

    const result: DdsPackageRiskScoreResult = {
      packageId: pkg.id,
      provider: 'internal_v1',
      score,
      band,
      reasons,
      scoredAt: new Date().toISOString(),
    };
    await this.appendRiskScoreAuditEvent(id, 'evaluated', context, result);
    await this.appendRiskScoreAuditEvent(id, band, context, result);
    return result;
  }

  private async appendRiskScoreAuditEvent(
    packageId: string,
    phase: DdsPackageRiskScoreAuditPhase,
    context: DdsPackageRiskScoreAuditContext,
    result?: DdsPackageRiskScoreResult,
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          context.userId ?? null,
          `dds_package_risk_score_${phase}`,
          JSON.stringify({
            packageId,
            tenantId: context.tenantId,
            exportedBy: context.exportedBy ?? null,
            provider: result?.provider ?? null,
            score: result?.score ?? null,
            band: result?.band ?? null,
            reasonCount: result?.reasons.length ?? null,
            scoredAt: result?.scoredAt ?? null,
          }),
        ],
      );
    } catch {
      // Risk score evaluation should not fail because audit append failed.
    }
  }

  async evaluateDdsPackageFilingPreflight(
    id: string,
    context: DdsPackageRiskScoreAuditContext,
  ): Promise<DdsPackageFilingPreflightResult> {
    await this.appendFilingPreflightAuditEvent(id, context, 'requested');
    const readiness = await this.evaluateDdsPackageReadiness(id);
    const risk = await this.evaluateDdsPackageRiskScore(id, context);
    const blocked = readiness.status === 'blocked';
    const result: DdsPackageFilingPreflightResult = {
      packageId: id,
      status: blocked ? 'preflight_blocked' : 'preflight_ready',
      readinessStatus: readiness.status,
      riskBand: risk.band,
      riskScore: risk.score,
      blockerCount: readiness.blockers.length,
      warningCount: readiness.warnings.length,
      checkedAt: new Date().toISOString(),
    };
    await this.appendFilingPreflightAuditEvent(
      id,
      context,
      'evaluated',
      result,
    );
    await this.appendFilingPreflightAuditEvent(
      id,
      context,
      blocked ? 'blocked' : 'ready',
      result,
    );
    return result;
  }

  private async appendFilingPreflightAuditEvent(
    packageId: string,
    context: DdsPackageRiskScoreAuditContext,
    phase: DdsPackageFilingPreflightAuditPhase,
    result?: DdsPackageFilingPreflightResult,
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          context.userId ?? null,
          `dds_package_filing_preflight_${phase}`,
          JSON.stringify({
            packageId,
            tenantId: context.tenantId,
            exportedBy: context.exportedBy ?? null,
            status: result?.status ?? null,
            readinessStatus: result?.readinessStatus ?? null,
            riskBand: result?.riskBand ?? null,
            riskScore: result?.riskScore ?? null,
            blockerCount: result?.blockerCount ?? null,
            warningCount: result?.warningCount ?? null,
            checkedAt: result?.checkedAt ?? null,
          }),
        ],
      );
    } catch {
      // Filing preflight should not fail because audit append failed.
    }
  }

  private async appendPackageGenerationAuditEvent(
    packageId: string,
    context: DdsPackageRiskScoreAuditContext,
    phase: DdsPackageGenerationAuditPhase,
    result?: DdsPackageGenerationResult,
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          context.userId ?? null,
          `dds_package_generation_${phase}`,
          JSON.stringify({
            packageId,
            tenantId: context.tenantId,
            exportedBy: context.exportedBy ?? null,
            status: result?.status ?? null,
            artifactVersion: result?.artifactVersion ?? null,
            lotCount: result?.lotCount ?? null,
            generatedAt: result?.generatedAt ?? null,
          }),
        ],
      );
    } catch {
      // Package generation should not fail because audit append failed.
    }
  }

  private async appendPackageSubmissionAuditEvent(
    packageId: string,
    idempotencyKey: string,
    context: DdsPackageRiskScoreAuditContext,
    phase: DdsPackageSubmissionAuditPhase,
    result?: SubmitDdsPackageResult,
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          context.userId ?? null,
          `dds_package_submission_${phase}`,
          JSON.stringify({
            packageId,
            tenantId: context.tenantId,
            exportedBy: context.exportedBy ?? null,
            idempotencyKey,
            submissionState: result?.submissionState ?? null,
            tracesReference: result?.tracesReference ?? null,
            replayed: result?.replayed ?? null,
            persistedAt: result?.persistedAt ?? null,
          }),
        ],
      );
    } catch {
      // Submission should not fail because audit append failed.
    }
  }
}

