import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { createSupabaseServerClient } from '../auth/supabase-server.client';
import { Pool } from 'pg';
import { resolveFarmerIdsForTenant, isFarmerInTenant } from '../common/tenant-farmer-scope';
import {
  claimSelfLinkedFarmerProfileForAuthUser,
  isFarmerProfileOwnedByUser,
  listFarmerProfileIdsForUser,
} from '../auth/farmer-ownership';
import { PG_POOL } from '../db/db.module';
import { plotKindEnum } from '../db/schema';
import { CreatePlotDto } from './dto/create-plot.dto';
import { normalizePlotGeometryCaptureInput } from './plot-geometry-capture';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { UpdatePlotGeometryDto } from './dto/update-plot-geometry.dto';
import { PlotGeometryHistoryEventDto } from './dto/plot-geometry-history-response.dto';
import { GfwContextService } from '../compliance/gfw-context.service';
import {
  applyGfwContextToPlotStatus,
  type GfwContextScreening,
} from '../compliance/gfw-context-fusion';
import { FdpCommodityService } from '../compliance/fdp-commodity.service';
import {
  applyFdpCommodityToPlotStatus,
  buildFdpContextSnapshot,
  screeningSupportsAutoReviewClear,
  type FdpCommodityScreening,
} from '../compliance/fdp-commodity-fusion';

/** CRM-seeded plots — never absorb a field-app upload reconcile. */
const CRM_DEMO_PLOT_IDS = ['39d548f9-1ef4-449b-9ebd-fd244ae5d69e'];
const EVIDENCE_SIGNED_URL_TTL_SECONDS = 60 * 60;
import { GfwService } from '../compliance/gfw.service';
import {
  buildGroundTruthPhotoVerification,
  type GroundTruthPhotoVerification,
} from '../compliance/ground-truth-photo-verification';
import {
  assertPointGeometryAllowed,
  pointBufferRadiusMeters,
  resolvePointBufferHa,
} from './plot-geometry-policy';
import { PlotGeometryValidationService } from './plot-geometry-validation.service';
import { TenureParseService } from './tenure-parse.service';
import { EvidenceDocumentsService } from './evidence-documents.service';
import { PushNotificationService } from '../consent/push-notification.service';
import { OnboardingEmailService } from '../launch/onboarding-email.service';
import {
  applyReviewClearanceGate,
  EUDR_DEFORESTATION_CUTOFF,
  gfwSummaryToPlotStatus,
  gfwSummaryToSignalTier,
  mergePlotComplianceStatus,
  overlapToPlotStatus,
  type DeforestationScreeningContextSnapshot,
  type DeforestationScreeningCommodityContextSnapshot,
  type DeforestationScreeningSnapshot,
  type GfwAlertSummary,
  type PlotComplianceStatus,
  verdictToPlotStatus,
} from '../compliance/plot-compliance-status';

export interface PlotGeometryHistoryPage {
  items: PlotGeometryHistoryEventDto[];
  anomalies: Array<{
    eventId: string;
    type: 'large_revision_jump' | 'frequent_supersession';
    severity: 'medium' | 'high';
    message: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  sort: 'desc' | 'asc';
  anomalyProfile: 'strict' | 'balanced' | 'lenient';
  signalsOnly: boolean;
  anomalySummary: {
    total: number;
    highSeverity: number;
    mediumSeverity: number;
    byType: {
      largeRevisionJump: number;
      frequentSupersession: number;
    };
  };
  anomalySummaryScope: 'current_page' | 'full_filtered_set';
}

export interface PlotAssignmentRow {
  assignmentId: string;
  plotId: string;
  agentUserId: string;
  status: 'active' | 'completed' | 'cancelled';
  assignedAt: string;
  endedAt: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
}

export interface PlotAssignmentListItem extends PlotAssignmentRow {}

export interface PlotAssignmentListPage {
  items: PlotAssignmentListItem[];
  total: number;
  limit: number;
  offset: number;
  status: 'all' | 'active' | 'completed' | 'cancelled';
  fromDays: number;
  agentUserId: string | null;
}

export interface PlotAssignmentExportAuditEvent {
  phase: 'requested' | 'succeeded' | 'failed';
  plotId: string;
  userId?: string | null;
  tenantId?: string | null;
  exportedBy?: string | null;
  rowCount?: number | null;
  filters: {
    status: 'all' | 'active' | 'completed' | 'cancelled';
    fromDays: number;
    agentUserId: string | null;
  };
  error?: string | null;
}

@Injectable()
export class PlotsService {
  private geometryCaptureColumnAvailable: boolean | null = null;
  private clientPlotIdColumnAvailable: boolean | null = null;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly gfw: GfwService,
    private readonly gfwContext: GfwContextService,
    private readonly fdpCommodity: FdpCommodityService,
    private readonly geometryValidation: PlotGeometryValidationService,
    private readonly tenureParse: TenureParseService,
    private readonly evidenceDocuments: EvidenceDocumentsService,
    private readonly pushNotifications: PushNotificationService,
    private readonly onboardingEmail: OnboardingEmailService,
  ) {}

  private async plotHasGeometryCaptureColumn(): Promise<boolean> {
    if (this.geometryCaptureColumnAvailable !== null) {
      return this.geometryCaptureColumnAvailable;
    }
    const res = await this.pool.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'plot'
          AND column_name = 'geometry_capture'
        LIMIT 1
      `,
    );
    this.geometryCaptureColumnAvailable = (res.rowCount ?? 0) > 0;
    return this.geometryCaptureColumnAvailable;
  }

  private async plotHasClientPlotIdColumn(): Promise<boolean> {
    if (this.clientPlotIdColumnAvailable !== null) {
      return this.clientPlotIdColumnAvailable;
    }
    const res = await this.pool.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'plot'
          AND column_name = 'client_plot_id'
        LIMIT 1
      `,
    );
    this.clientPlotIdColumnAvailable = (res.rowCount ?? 0) > 0;
    return this.clientPlotIdColumnAvailable;
  }

  private async findExistingPlotByClientPlotId(
    farmerId: string,
    clientPlotId: string,
  ): Promise<{ id: string; name: string; client_plot_id: string | null } | null> {
    const hasClientPlotId = await this.plotHasClientPlotIdColumn();
    if (hasClientPlotId) {
      const byClient = await this.pool.query<{
        id: string;
        name: string;
        client_plot_id: string | null;
      }>(
        `
          SELECT id, name, client_plot_id
          FROM plot
          WHERE farmer_id = $1
            AND client_plot_id = $2
          LIMIT 1
        `,
        [farmerId, clientPlotId],
      );
      if ((byClient.rowCount ?? 0) > 0) {
        return byClient.rows[0];
      }
    }

    const legacy = await this.pool.query<{
      id: string;
      name: string;
      client_plot_id: string | null;
    }>(
      `
        SELECT id, name, client_plot_id
        FROM plot
        WHERE farmer_id = $1
          AND name = $2
        LIMIT 1
      `,
      [farmerId, clientPlotId],
    );
    if ((legacy.rowCount ?? 0) > 0) {
      return legacy.rows[0];
    }
    return null;
  }

  /** Orphan server row (no client_plot_id) from a prior upload retry — reconcile instead of INSERT. */
  private async findExistingOrphanPlotForReconcile(
    farmerId: string,
    displayName: string,
    kind: (typeof plotKindEnum.enumValues)[number],
  ): Promise<{ id: string; name: string; client_plot_id: string | null } | null> {
    const trimmed = displayName.trim();
    if (!trimmed) return null;

    const res = await this.pool.query<{
      id: string;
      name: string;
      client_plot_id: string | null;
    }>(
      `
        SELECT id, name, client_plot_id
        FROM plot
        WHERE farmer_id = $1
          AND lower(btrim(name)) = lower(btrim($2))
          AND kind = $3::plot_kind
          AND client_plot_id IS NULL
          AND NOT (id = ANY($4::uuid[]))
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [farmerId, trimmed, kind, CRM_DEMO_PLOT_IDS],
    );
    return (res.rowCount ?? 0) > 0 ? res.rows[0] : null;
  }

  private async returnReconciledExistingPlot(params: {
    existingPlot: { id: string; name: string; client_plot_id: string | null };
    clientPlotId: string;
    displayName: string | null;
  }) {
    const nextName = await this.reconcileExistingPlotClientIdentity({
      plotId: params.existingPlot.id,
      clientPlotId: params.clientPlotId,
      displayName: params.displayName,
      existingName: params.existingPlot.name,
      existingClientPlotId: params.existingPlot.client_plot_id,
    });
    return {
      ...params.existingPlot,
      name: nextName,
      client_plot_id: params.clientPlotId.trim(),
      reconciledExisting: true as const,
    };
  }

  private async reconcileExistingPlotClientIdentity(params: {
    plotId: string;
    clientPlotId: string;
    displayName: string | null;
    existingName: string;
    existingClientPlotId: string | null;
  }): Promise<string> {
    const hasClientPlotId = await this.plotHasClientPlotIdColumn();
    let nextName = params.existingName;

    if (hasClientPlotId && !params.existingClientPlotId?.trim()) {
      await this.pool.query(
        `
          UPDATE plot
          SET client_plot_id = $2,
              updated_at = NOW()
          WHERE id = $1
            AND client_plot_id IS NULL
        `,
        [params.plotId, params.clientPlotId],
      );
    }

    if (params.displayName && params.displayName !== params.existingName) {
      const updateRes = await this.pool.query<{ name: string }>(
        `
          UPDATE plot
          SET name = $2,
              updated_at = NOW()
          WHERE id = $1
          RETURNING name
        `,
        [params.plotId, params.displayName],
      );
      nextName = updateRes.rows[0]?.name ?? params.displayName;
    }

    return nextName;
  }

  private static parseNumeric(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private static computeGeometryHistoryAnomalies(
    events: PlotGeometryHistoryEventDto[],
    profile: 'strict' | 'balanced' | 'lenient',
  ): PlotGeometryHistoryPage['anomalies'] {
    const thresholds = {
      strict: {
        largeJumpMinPct: 2,
        highLargeJumpMinPct: 3,
        supersessionWindowMin: 240,
        highSupersessionWindowMin: 60,
      },
      balanced: {
        largeJumpMinPct: 3,
        highLargeJumpMinPct: 4,
        supersessionWindowMin: 120,
        highSupersessionWindowMin: 30,
      },
      lenient: {
        largeJumpMinPct: 4,
        highLargeJumpMinPct: 5,
        supersessionWindowMin: 60,
        highSupersessionWindowMin: 15,
      },
    }[profile];

    const anomalies: PlotGeometryHistoryPage['anomalies'] = [];
    const superseded = events.filter((event) => event.eventType === 'plot_geometry_superseded');

    for (const event of superseded) {
      const details = event.payload?.details ?? {};
      const geometryNormalization =
        details &&
        typeof details === 'object' &&
        'geometryNormalization' in details &&
        typeof (details as Record<string, unknown>).geometryNormalization === 'object'
          ? ((details as Record<string, unknown>).geometryNormalization as Record<string, unknown>)
          : null;

      const correctionVariancePct = PlotsService.parseNumeric(geometryNormalization?.correctionVariancePct);
      if (correctionVariancePct != null && correctionVariancePct >= thresholds.largeJumpMinPct) {
        anomalies.push({
          eventId: event.id,
          type: 'large_revision_jump',
          severity: correctionVariancePct >= thresholds.highLargeJumpMinPct ? 'high' : 'medium',
          message: `Large revision jump: ${correctionVariancePct.toFixed(2)}% area correction variance.`,
        });
      }
    }

    for (let index = 1; index < superseded.length; index += 1) {
      const current = superseded[index];
      const previous = superseded[index - 1];
      const currentTime = Date.parse(current.timestamp);
      const previousTime = Date.parse(previous.timestamp);
      if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) continue;
      const diffMinutes = Math.abs(previousTime - currentTime) / (1000 * 60);
      if (diffMinutes <= thresholds.supersessionWindowMin) {
        anomalies.push({
          eventId: current.id,
          type: 'frequent_supersession',
          severity: diffMinutes <= thresholds.highSupersessionWindowMin ? 'high' : 'medium',
          message: `Frequent supersession: another geometry change within ${Math.round(diffMinutes)} minutes.`,
        });
      }
    }

    return anomalies;
  }

  private static summarizeGeometryHistoryAnomalies(
    anomalies: PlotGeometryHistoryPage['anomalies'],
  ): PlotGeometryHistoryPage['anomalySummary'] {
    let highSeverity = 0;
    let mediumSeverity = 0;
    let largeRevisionJump = 0;
    let frequentSupersession = 0;
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'high') highSeverity += 1;
      else mediumSeverity += 1;
      if (anomaly.type === 'large_revision_jump') largeRevisionJump += 1;
      else frequentSupersession += 1;
    }
    return {
      total: anomalies.length,
      highSeverity,
      mediumSeverity,
      byType: {
        largeRevisionJump,
        frequentSupersession,
      },
    };
  }

  /**
   * The offline app generates a local farmer UUID. Plot rows reference farmer_profile.id;
   * ensure a row exists and is owned by the authenticated Supabase user (fixes FK plot_farmer_id_fkey).
   */
  private async runPolygonGeometryQualityGate(params: {
    geometrySql: string;
    farmerId: string;
    excludePlotId?: string;
    userId?: string;
    tenantId?: string | null;
    audit: {
      phase: 'create' | 'geometry_update';
      clientPlotId?: string;
      plotId?: string;
      reason?: string;
    };
  }): Promise<void> {
    const result = await this.geometryValidation.validatePolygonCandidate({
      geometrySql: params.geometrySql,
      farmerId: params.farmerId,
      excludePlotId: params.excludePlotId,
    });

    await this.pool.query(
      `INSERT INTO audit_log (user_id, event_type, payload) VALUES ($1, $2, $3::jsonb)`,
      [
        params.userId ?? null,
        'plot_geometry_quality_checked',
        JSON.stringify({
          ok: result.ok,
          tenantId: params.tenantId ?? null,
          farmerId: params.farmerId,
          clientPlotId: params.audit.clientPlotId ?? null,
          plotId: params.audit.plotId ?? null,
          phase: params.audit.phase,
          reason: params.audit.reason ?? null,
          issues: result.issues,
          metrics: result.metrics,
        }),
      ],
    );

    if (!result.ok) {
      const blocking = result.issues.find((issue) => issue.severity === 'error');
      const message = blocking?.message ?? 'Invalid boundary. Please walk or redraw the perimeter.';
      void this.pushNotifications
        .notifyGeometryQualityRejected({
          farmerId: params.farmerId,
          tenantId: params.tenantId ?? null,
          clientPlotId: params.audit.clientPlotId ?? null,
          plotId: params.audit.plotId ?? null,
          code: blocking?.code ?? 'GEO-104',
          message,
        })
        .catch(() => undefined);
      throw new BadRequestException({
        statusCode: 400,
        code: blocking?.code ?? 'GEO-104',
        message,
        details: blocking?.details ?? null,
      });
    }
  }

  async bootstrapFieldAppProducer(params: {
    farmerId: string;
    userId: string;
    countryCode?: string;
    fullName?: string | null;
    email?: string | null;
  }): Promise<{ created: boolean }> {
    const created = await this.ensureFarmerProfileForPlot(params.farmerId, params.userId, {
      countryCode: params.countryCode,
      producerDisplayName: params.fullName ?? null,
    });
    await claimSelfLinkedFarmerProfileForAuthUser(
      this.pool,
      params.farmerId,
      params.userId,
    );
    if (params.fullName?.trim()) {
      await this.pool.query(
        `
          UPDATE user_account
          SET name = $2
          WHERE id = $1::uuid
        `,
        [params.userId, params.fullName.trim()],
      );
    }
    this.maybeSendFarmerWelcome({
      created,
      userId: params.userId,
      farmerId: params.farmerId,
      email: params.email,
      fullName: params.fullName ?? null,
    });
    return { created };
  }

  async listFarmerProfileIdsForAuthUser(userId: string): Promise<string[]> {
    return listFarmerProfileIdsForUser(this.pool, userId);
  }

  private maybeSendFarmerWelcome(input: {
    created: boolean;
    userId: string;
    farmerId: string;
    email?: string | null;
    fullName?: string | null;
  }): void {
    if (!input.created || !input.email?.trim()) {
      return;
    }
    void this.onboardingEmail
      .sendFarmerWelcomeAfterFieldSignup({
        userId: input.userId,
        farmerId: input.farmerId,
        email: input.email,
        fullName: input.fullName ?? null,
      })
      .catch(() => undefined);
  }

  private async ensureFarmerProfileForPlot(
    farmerId: string,
    authUserId: string | undefined,
    options?: {
      countryCode?: string;
      tenantId?: string | null;
      producerContactId?: string | null;
      producerDisplayName?: string | null;
    },
  ): Promise<boolean> {
    if (!authUserId) {
      throw new BadRequestException('Missing authenticated user for plot creation');
    }

    const countryCode = options?.countryCode ?? 'HN';
    const tenantId = options?.tenantId ?? null;
    const producerContactId = options?.producerContactId?.trim() || null;
    const producerDisplayName = options?.producerDisplayName?.trim() || null;
    const delegatedRegistration = farmerId !== authUserId;

    const existing = await this.pool.query(`SELECT user_id FROM farmer_profile WHERE id = $1::uuid`, [
      farmerId,
    ]);
    if (existing.rows.length > 0) {
      if (delegatedRegistration) {
        await this.linkProducerToTenantDirectory({
          tenantId,
          farmerId,
          producerContactId,
          producerDisplayName,
        });
        if (tenantId && !(await isFarmerInTenant(this.pool, farmerId, tenantId))) {
          throw new ForbiddenException('This producer is not in your workspace directory.');
        }
        return false;
      }
      const owner = String(existing.rows[0].user_id);
      if (owner !== authUserId) {
        throw new ForbiddenException(
          'This farmer ID is already linked to another account. Use the profile from your device.',
        );
      }
      return false;
    }

    const profileUserId = delegatedRegistration ? farmerId : authUserId;

    await this.pool.query(
      `
      INSERT INTO user_account (id, role, name)
      VALUES ($1::uuid, 'farmer', $2)
      ON CONFLICT (id) DO UPDATE
      SET name = COALESCE(user_account.name, EXCLUDED.name)
    `,
      [profileUserId, producerDisplayName],
    );

    await this.pool.query(
      `
      INSERT INTO farmer_profile (id, user_id, country_code, self_declared, status)
      VALUES ($1::uuid, $2::uuid, $3, true, 'active')
    `,
      [farmerId, profileUserId, countryCode],
    );

    await this.linkProducerToTenantDirectory({
      tenantId,
      farmerId,
      producerContactId,
      producerDisplayName,
    });
    return true;
  }

  private async linkProducerToTenantDirectory(input: {
    tenantId: string | null;
    farmerId: string;
    producerContactId: string | null;
    producerDisplayName: string | null;
  }): Promise<void> {
    if (!input.tenantId) {
      return;
    }

    if (input.producerContactId) {
      try {
        await this.pool.query(
          `
            UPDATE crm_contacts
            SET farmer_profile_id = $1, updated_at = NOW()
            WHERE tenant_id = $2
              AND id = $3
          `,
          [input.farmerId, input.tenantId, input.producerContactId],
        );
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01' && code !== '42703') {
          throw error;
        }
      }
    }

    if (input.producerDisplayName) {
      await this.pool.query(
        `
          UPDATE user_account
          SET name = COALESCE(name, $2)
          WHERE id = $1::uuid
        `,
        [input.farmerId, input.producerDisplayName],
      );
    }
  }

  async create(
    createDto: CreatePlotDto,
    userId: string | undefined,
    tenantId?: string | null,
    actorContact?: { email?: string | null; fullName?: string | null },
  ) {
    const {
      geometry,
      declaredAreaHa,
      precisionMeters,
      hdop,
      farmerId,
      clientPlotId,
      cadastralKey,
      landTitlePhotos,
      productionSystem,
      producerContactId,
      geometryCapture,
    } = createDto;
    const displayName = createDto.name?.trim() || null;
    const plotName = displayName || clientPlotId;
    const geometryCapturePayload = normalizePlotGeometryCaptureInput(geometryCapture);

    let producerDisplayName: string | null = null;
    if (producerContactId?.trim() && tenantId) {
      try {
        const contactRes = await this.pool.query<{ full_name: string | null }>(
          `SELECT full_name FROM crm_contacts WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
          [tenantId, producerContactId.trim()],
        );
        producerDisplayName = contactRes.rows[0]?.full_name?.trim() || null;
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== '42P01') {
          throw error;
        }
      }
    }

    const profileCreated = await this.ensureFarmerProfileForPlot(farmerId, userId, {
      tenantId,
      producerContactId: producerContactId?.trim() || null,
      producerDisplayName,
    });
    if (userId) {
      this.maybeSendFarmerWelcome({
        created: profileCreated,
        userId,
        farmerId,
        email: actorContact?.email,
        fullName: actorContact?.fullName,
      });
    }

    const existingPlot = await this.findExistingPlotByClientPlotId(farmerId, clientPlotId);
    if (existingPlot) {
      return this.returnReconciledExistingPlot({
        existingPlot,
        clientPlotId,
        displayName,
      });
    }

    // Simple validation: ensure 6 decimal places for coords
    const ensureSixDecimals = (value: number) => Number(value.toFixed(6));

    let geometrySql: string;
    let kind: (typeof plotKindEnum.enumValues)[number];
    let polygonWkt: string | null = null;

    if (geometry.type === 'Point') {
      assertPointGeometryAllowed({ declaredAreaHa: declaredAreaHa ?? null });
      const [lon, lat] = geometry.coordinates.map(ensureSixDecimals) as [number, number];
      geometrySql = `ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)`;
      kind = 'point';
    } else if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new BadRequestException('Polygon must have at least one ring');
      }
      const firstRing = rings[0];
      if (firstRing.length < 4) {
        throw new BadRequestException('Polygon ring must have at least 4 vertices');
      }
      const closedRing =
        firstRing[0][0] === firstRing[firstRing.length - 1][0] &&
        firstRing[0][1] === firstRing[firstRing.length - 1][1]
          ? firstRing
          : [...firstRing, firstRing[0]];

      const coordText = closedRing
        .map(([lon, lat]: [number, number]) => `${ensureSixDecimals(lon)} ${ensureSixDecimals(lat)}`)
        .join(', ');
      polygonWkt = `POLYGON((${coordText}))`;
      geometrySql = `ST_SetSRID(ST_GeomFromText('${polygonWkt}'), 4326)`;
      kind = 'polygon';
      await this.runPolygonGeometryQualityGate({
        geometrySql,
        farmerId,
        userId,
        tenantId,
        audit: { phase: 'create', clientPlotId },
      });
    } else {
      throw new BadRequestException('Unsupported geometry type');
    }

    if (clientPlotId?.trim() && displayName) {
      const orphanPlot = await this.findExistingOrphanPlotForReconcile(
        farmerId,
        displayName,
        kind,
      );
      if (orphanPlot) {
        return this.returnReconciledExistingPlot({
          existingPlot: orphanPlot,
          clientPlotId,
          displayName,
        });
      }
    }

    // Insert using raw SQL to leverage PostGIS functions for area and centroid.
    // For polygons, auto-correct invalid geometry via ST_MakeValid and reject if
    // correction changes area by more than 5%.
    const hasGeometryCapture = await this.plotHasGeometryCaptureColumn();
    const hasClientPlotId = await this.plotHasClientPlotIdColumn();
    let optionalInsertCols = '';
    let optionalSelectValues = '';
    const insertParams: unknown[] = [
      farmerId,
      plotName,
      kind,
      declaredAreaHa ?? null,
      precisionMeters ?? null,
      hdop ?? null,
      kind,
      productionSystem ?? null,
    ];
    let paramIndex = 9;
    if (hasGeometryCapture) {
      optionalInsertCols += `,
          geometry_capture`;
      optionalSelectValues += `,
          $${paramIndex}::jsonb`;
      insertParams.push(geometryCapturePayload ? JSON.stringify(geometryCapturePayload) : null);
      paramIndex += 1;
    }
    if (hasClientPlotId) {
      optionalInsertCols += `,
          client_plot_id`;
      optionalSelectValues += `,
          $${paramIndex}`;
      insertParams.push(clientPlotId);
      paramIndex += 1;
    }

    const text = `
      WITH input_geom AS (
        SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
      ),
      normalized AS (
        SELECT
          CASE
            WHEN $7::text = 'polygon' THEN ST_CollectionExtract(ST_MakeValid(geom), 3)
            ELSE geom
          END AS geom,
          CASE
            WHEN $7::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS original_area_ha
        FROM input_geom
      ),
      validated AS (
        SELECT
          geom,
          original_area_ha,
          CASE
            WHEN $7::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS normalized_area_ha,
          CASE
            WHEN $7::text = 'polygon' AND original_area_ha > 0
              THEN ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / original_area_ha * 100.0
            ELSE NULL
          END AS correction_variance_pct
        FROM normalized
      ),
      ins AS (
        INSERT INTO plot (
          farmer_id,
          name,
          geometry,
          geography,
          centroid,
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          hdop_at_capture,
          production_system${optionalInsertCols}
        )
        SELECT
          $1,
          $2,
          v.geom,
          v.geom::geography,
          ST_Centroid(v.geom),
          $3,
          ST_Area(v.geom::geography) / 10000.0,
          $4,
          $5,
          $6,
          $8${optionalSelectValues}
        FROM validated v
        WHERE (
          $7::text <> 'polygon'
          OR v.geom IS NOT NULL
        ) AND (
          $7::text <> 'polygon'
          OR v.correction_variance_pct IS NULL
          OR v.correction_variance_pct <= 5
        )
        RETURNING *
      )
      SELECT
        i.*,
        v.original_area_ha,
        v.normalized_area_ha,
        v.correction_variance_pct
      FROM ins i
      CROSS JOIN validated v;
    `;

    const result = await this.pool.query(text, insertParams);

    if (result.rowCount === 0 && kind === 'polygon') {
      const varianceProbe = await this.pool.query(
        `
          WITH input_geom AS (
            SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
          ),
          normalized AS (
            SELECT
              ST_CollectionExtract(ST_MakeValid(geom), 3) AS geom,
              ST_Area(geom::geography) / 10000.0 AS original_area_ha
            FROM input_geom
          )
          SELECT
            CASE
              WHEN geom IS NULL THEN NULL
              ELSE ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / NULLIF(original_area_ha, 0) * 100.0
            END AS correction_variance_pct
          FROM normalized
        `,
      );
      const variance = Number(varianceProbe.rows?.[0]?.correction_variance_pct);
      if (Number.isFinite(variance) && variance > 5) {
        throw new BadRequestException(
          `GEO-102: Geometry correction variance ${variance.toFixed(2)}% exceeds 5% tolerance.`,
        );
      }
      throw new BadRequestException(
        'GEO-101: Invalid polygon geometry could not be normalized with ST_MakeValid.',
      );
    }

    const row = result.rows[0];

    // Point geometry has ~0 computed area; declared hectares are stored separately (GEO-103 uses declared only).
    if (kind !== 'point' && declaredAreaHa != null && row?.area_ha != null) {
      const areaHa = Number(row.area_ha);
      const diffPct = Math.abs(areaHa - declaredAreaHa) / declaredAreaHa * 100;
      if (diffPct > 5) {
        throw new BadRequestException(
          `Area discrepancy ${diffPct.toFixed(1)}% exceeds 5% tolerance.`,
        );
      }
    }

    // Audit: plot created
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_created',
        JSON.stringify({
          plotId: row.id,
          farmerId,
          clientPlotId,
          cadastralKey: cadastralKey ?? null,
          landTitlePhotos:
            Array.isArray(landTitlePhotos) && landTitlePhotos.length > 0
              ? landTitlePhotos
              : null,
          geometryNormalization:
            kind === 'polygon'
              ? {
                  originalAreaHa: row.original_area_ha ?? null,
                  normalizedAreaHa: row.normalized_area_ha ?? null,
                  correctionVariancePct: row.correction_variance_pct ?? null,
                }
              : null,
        }),
      ],
    );

    void this.scheduleDeforestationScreening(row.id, userId);

    if (hasClientPlotId && clientPlotId?.trim() && !String(row.client_plot_id ?? '').trim()) {
      await this.pool.query(
        `
          UPDATE plot
          SET client_plot_id = $2,
              updated_at = NOW()
          WHERE id = $1
            AND client_plot_id IS NULL
        `,
        [row.id, clientPlotId.trim()],
      );
      row.client_plot_id = clientPlotId.trim();
    }

    return row;
  }

  private scheduleDeforestationScreening(plotId: string, userId: string | undefined): void {
    void this.runGfwCheck(plotId, userId).catch(() => {
      // Screening failures are audited inside runGfwCheck; plot creation must not fail.
    });
  }

  /**
   * Idempotency guard for offline sync audit envelopes (B7). Replays of the same
   * client_event_id from the offline queue must not create duplicate audit rows.
   * Returns true when an existing envelope is found and the caller should skip.
   */
  private async isSyncAuditEnvelopeDuplicate(
    eventType: string,
    plotId: string,
    clientEventId: string | null | undefined,
  ): Promise<boolean> {
    const trimmed = (clientEventId ?? '').trim();
    if (!trimmed) return false;
    const res = await this.pool.query(
      `SELECT 1 FROM audit_log
       WHERE event_type = $1
         AND payload->>'plotId' = $2
         AND payload->>'clientEventId' = $3
       LIMIT 1`,
      [eventType, plotId, trimmed],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async syncPhotos(
    plotId: string,
    dto: SyncPlotPhotosDto,
    userId: string | undefined,
    tenantId?: string | null,
  ) {
    // Ensure plot exists (lightweight guard so we do not accept orphaned photos)
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const photosArray = Array.isArray(dto.photos) ? dto.photos : [];

    if (
      await this.isSyncAuditEnvelopeDuplicate('plot_photos_synced', plotId, dto.clientEventId)
    ) {
      // Idempotent replay — skip duplicate audit row and downstream side effects.
      return { plotId, kind: dto.kind, count: photosArray.length, deduplicated: true };
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_photos_synced',
        JSON.stringify({
          plotId,
          kind: dto.kind,
          count: photosArray.length,
          photos: photosArray,
          note: dto.note ?? null,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    if (dto.kind === 'ground_truth') {
      const plotRow = await this.getPlotStatusRow(plotId).catch(() => null);
      const verification = await this.verifyGroundTruthPhotosOnPlot(plotId, photosArray);
      if (plotRow?.status === 'under_review' && verification.clearanceEligible) {
        void this.runGfwCheck(plotId, userId).catch(() => {
          // Re-screen after geo-verified photo gate; failures are audited in runGfwCheck.
        });
      }
    }

    if (dto.kind === 'land_title') {
      const withStorage = photosArray
        .filter(
          (photo) =>
            typeof photo?.storagePath === 'string' && String(photo.storagePath).trim().length > 0,
        )
        .map((photo) => ({
          storagePath: String(photo.storagePath).trim(),
          mimeType: typeof photo?.mimeType === 'string' ? photo.mimeType : null,
          label: typeof photo?.label === 'string' ? photo.label : 'land_title_photo',
        }));

      if (withStorage.length > 0) {
        await this.tenureParse.enqueueFromLandTitleSync(plotId, withStorage, {
          tenantId: tenantId ?? null,
          userId: userId ?? null,
        });
      }
    }

    return { ok: true };
  }

  async syncLegal(plotId: string, dto: SyncPlotLegalDto, userId: string | undefined) {
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    if (
      await this.isSyncAuditEnvelopeDuplicate('plot_legal_synced', plotId, dto.clientEventId)
    ) {
      return { ok: true, deduplicated: true };
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, device_id, event_type, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        userId ?? null,
        dto.deviceId ?? null,
        'plot_legal_synced',
        JSON.stringify({
          plotId,
          cadastralKey: dto.cadastralKey ?? null,
          informalTenure: dto.informalTenure ?? null,
          informalTenureNote: dto.informalTenureNote ?? null,
          reason: dto.reason,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    void this.tenureParse.reevaluateCadastralCrossChecksForPlot(plotId).catch(() => undefined);

    return { ok: true };
  }

  async syncEvidence(
    plotId: string,
    dto: SyncPlotEvidenceDto,
    userId: string | undefined,
    tenantId?: string | null,
  ) {
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const itemsArray = Array.isArray(dto.items) ? dto.items : [];

    if (
      await this.isSyncAuditEnvelopeDuplicate('plot_evidence_synced', plotId, dto.clientEventId)
    ) {
      return { ok: true, deduplicated: true };
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_evidence_synced',
        JSON.stringify({
          plotId,
          tenantId: tenantId ?? null,
          kind: dto.kind,
          reason: dto.reason,
          note: dto.note ?? null,
          count: itemsArray.length,
          items: itemsArray,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    for (const item of itemsArray) {
      await this.evidenceDocuments.upsertFromEvidenceSync({
        plotId,
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        kind: dto.kind,
        item,
      });
    }

    await this.tenureParse.enqueueFromEvidenceSync(plotId, dto.kind, itemsArray, {
      tenantId: tenantId ?? null,
      userId: userId ?? null,
    });

    return { ok: true };
  }

  async listTenureVerification(plotId: string) {
    this.tenureParse.schedulePlotParseWorker(plotId);
    return this.tenureParse.listForPlot(plotId);
  }

  async listSyncedEvidence(plotId: string) {
    return this.evidenceDocuments.listSyncedDocumentsForPlot(plotId);
  }

  /** Service-role signed URL for farmer-owned plot evidence (cross-device restore). */
  async createFarmerPlotEvidenceSignedUrl(
    plotId: string,
    storagePath: string,
  ): Promise<{ signed_url: string; expires_in: number }> {
    const normalized = storagePath.trim().replace(/^\/+/, '').replace(/^plot-evidence\//, '');
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Invalid evidence storage path.');
    }

    const linked = await this.pool.query<{ ok: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM plot_tenure_verification
          WHERE plot_id = $1::uuid
            AND trim(storage_path) = $2
        )
        OR EXISTS (
          SELECT 1
          FROM evidence_documents
          WHERE plot_id = $1::uuid
            AND trim(file_storage_key) = $2
        ) AS ok
      `,
      [plotId, normalized],
    );
    if (!linked.rows[0]?.ok) {
      throw new ForbiddenException('Evidence file is not registered for this plot.');
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException('Evidence storage signing is not configured.');
    }

    const bucket = process.env.EVIDENCE_STORAGE_BUCKET?.trim() || 'plot-evidence';
    const supabase = createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalized, EVIDENCE_SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new BadRequestException(error?.message ?? 'Could not create signed URL for evidence file.');
    }

    return { signed_url: data.signedUrl, expires_in: EVIDENCE_SIGNED_URL_TTL_SECONDS };
  }

  async listTenureReviewQueue(
    tenantId: string,
    canAccessPlot?: (plotId: string) => Promise<boolean>,
  ) {
    return this.tenureParse.listReviewQueue(tenantId, canAccessPlot);
  }

  async confirmTenureReview(
    plotId: string,
    verificationId: string,
    params: { reason: string; note?: string | null },
    userId: string | undefined,
  ) {
    if (!userId) {
      throw new BadRequestException('Authenticated reviewer required');
    }
    return this.tenureParse.confirmTenureReview({
      plotId,
      verificationId,
      userId,
      reason: params.reason,
      note: params.note ?? null,
    });
  }

  private async getPlotGeometryForCompliance(plotId: string) {
    const pointBufferM = pointBufferRadiusMeters(resolvePointBufferHa());
    const geoRes = await this.pool.query(
      `
        SELECT
          id,
          kind,
          -- Buffer point plots to the configured risk-engine footprint (default 1.0 ha).
          CASE
            WHEN kind = 'point' THEN ST_AsGeoJSON(ST_Buffer(geometry::geography, $2)::geometry)
            ELSE ST_AsGeoJSON(geometry)
          END AS geojson
        FROM plot
        WHERE id = $1
      `,
      [plotId, pointBufferM],
    );

    if (geoRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    let geometry: any = null;
    try {
      geometry = JSON.parse(geoRes.rows[0].geojson);
    } catch {
      throw new BadRequestException('Could not parse plot geometry');
    }
    return geometry;
  }

  private normalizeGfwResult(result: any): GfwAlertSummary {
    // We expect SQL like: SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data
    if (!result) return { alertCount: null, alertAreaHa: null };
    const r = result?.data ?? result;
    // Common shapes: { data: [{count: 0, area_ha: 0.1}] } OR just [{...}]
    const first = Array.isArray(r) ? r[0] : Array.isArray(r?.data) ? r.data[0] : r?.[0];
    const countVal = first?.count ?? first?.COUNT ?? first?.['count'] ?? null;
    const areaVal = first?.area_ha ?? first?.areaHa ?? first?.['area__ha'] ?? null;
    const alertCount =
      typeof countVal === 'number' ? countVal : typeof countVal === 'string' ? Number(countVal) : null;
    const alertAreaHa =
      typeof areaVal === 'number' ? areaVal : typeof areaVal === 'string' ? Number(areaVal) : null;
    return {
      alertCount: Number.isFinite(alertCount as any) ? (alertCount as number) : null,
      alertAreaHa: Number.isFinite(alertAreaHa as any) ? (alertAreaHa as number) : null,
    };
  }

  private async getPlotStatusRow(plotId: string): Promise<{
    status: PlotComplianceStatus;
    production_system: string | null;
    deforestation_screening: unknown;
  }> {
    const res = await this.pool.query(
      `
        SELECT status, production_system, deforestation_screening
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    return {
      status: (res.rows[0].status ?? 'pending_check') as PlotComplianceStatus,
      production_system:
        typeof res.rows[0].production_system === 'string' ? res.rows[0].production_system : null,
      deforestation_screening: res.rows[0].deforestation_screening ?? null,
    };
  }

  private async getLatestGroundTruthPhotos(plotId: string): Promise<unknown[]> {
    const res = await this.pool.query(
      `
        SELECT payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type = 'plot_photos_synced'
          AND payload ->> 'kind' = 'ground_truth'
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      return [];
    }
    const payload = res.rows[0].payload ?? {};
    const photos = payload.photos;
    return Array.isArray(photos) ? photos : [];
  }

  private async verifyGroundTruthPhotosOnPlot(
    plotId: string,
    photos: unknown[],
  ): Promise<GroundTruthPhotoVerification> {
    const totalCount = photos.length;
    if (totalCount === 0) {
      return buildGroundTruthPhotoVerification({
        totalCount: 0,
        geoTaggedCount: 0,
        geoVerifiedCount: 0,
        timestampVerifiedCount: 0,
        clearanceVerifiedCount: 0,
      });
    }

    const res = await this.pool.query(
      `
        WITH photos AS (
          SELECT elem AS photo
          FROM jsonb_array_elements($2::jsonb) AS elem
        ),
        parsed AS (
          SELECT
            photo,
            COALESCE(
              NULLIF(photo ->> 'latitude', '')::double precision,
              NULLIF(photo ->> 'lat', '')::double precision
            ) AS lat,
            COALESCE(
              NULLIF(photo ->> 'longitude', '')::double precision,
              NULLIF(photo ->> 'lng', '')::double precision,
              NULLIF(photo ->> 'lon', '')::double precision
            ) AS lon,
            CASE
              WHEN COALESCE(photo ->> 'takenAt', photo ->> 'taken_at', '') ~ '^\\d{10,16}$'
                THEN to_timestamp(
                  (COALESCE(photo ->> 'takenAt', photo ->> 'taken_at'))::bigint /
                  CASE
                    WHEN length(COALESCE(photo ->> 'takenAt', photo ->> 'taken_at')) > 10 THEN 1000.0
                    ELSE 1.0
                  END
                )
              WHEN COALESCE(photo ->> 'takenAt', photo ->> 'taken_at', '') <> ''
                THEN (COALESCE(photo ->> 'takenAt', photo ->> 'taken_at'))::timestamptz
              ELSE NULL
            END AS taken_at
          FROM photos
        ),
        plot_row AS (
          SELECT id, kind, geography, precision_m_at_capture
          FROM plot
          WHERE id = $1
        ),
        geo_verified AS (
          SELECT p.*
          FROM parsed p
          CROSS JOIN plot_row pr
          WHERE pr.id IS NOT NULL
            AND p.lat BETWEEN -90 AND 90
            AND p.lon BETWEEN -180 AND 180
            AND (
              (
                pr.kind = 'polygon'
                AND ST_Covers(
                  pr.geography::geometry,
                  ST_SetSRID(ST_Point(p.lon, p.lat), 4326)
                )
              )
              OR (
                pr.kind = 'point'
                AND ST_DWithin(
                  pr.geography,
                  ST_SetSRID(ST_Point(p.lon, p.lat), 4326)::geography,
                  COALESCE(pr.precision_m_at_capture, 25)
                )
              )
            )
        )
        SELECT
          (SELECT COUNT(*)::int FROM parsed) AS total_count,
          (
            SELECT COUNT(*)::int
            FROM parsed
            WHERE lat BETWEEN -90 AND 90
              AND lon BETWEEN -180 AND 180
          ) AS geo_tagged_count,
          (SELECT COUNT(*)::int FROM geo_verified) AS geo_verified_count,
          (
            SELECT COUNT(*)::int
            FROM parsed
            WHERE taken_at IS NOT NULL
              AND taken_at::date > $3::date
          ) AS timestamp_verified_count,
          (
            SELECT COUNT(*)::int
            FROM geo_verified
            WHERE taken_at IS NOT NULL
              AND taken_at::date > $3::date
          ) AS clearance_verified_count
      `,
      [plotId, JSON.stringify(photos), EUDR_DEFORESTATION_CUTOFF],
    );

    const row = res.rows[0] ?? {};
    return buildGroundTruthPhotoVerification({
      totalCount: Number(row.total_count) || 0,
      geoTaggedCount: Number(row.geo_tagged_count) || 0,
      geoVerifiedCount: Number(row.geo_verified_count) || 0,
      timestampVerifiedCount: Number(row.timestamp_verified_count) || 0,
      clearanceVerifiedCount: Number(row.clearance_verified_count) || 0,
    });
  }

  private async getGroundTruthPhotoVerification(plotId: string): Promise<GroundTruthPhotoVerification> {
    const photos = await this.getLatestGroundTruthPhotos(plotId);
    return this.verifyGroundTruthPhotosOnPlot(plotId, photos);
  }

  private async finalizePlotComplianceStatus(params: {
    plotId: string;
    proposedStatus: PlotComplianceStatus;
    gfwSummary: GfwAlertSummary;
    contextAutoClear?: boolean;
    currentStatus?: PlotComplianceStatus;
  }): Promise<{
    status: PlotComplianceStatus;
    reviewClearanceBlocked: boolean;
    groundTruthPhotos: GroundTruthPhotoVerification;
  }> {
    const currentStatus =
      params.currentStatus ?? (await this.getPlotStatusRow(params.plotId)).status;
    const groundTruthPhotos = await this.getGroundTruthPhotoVerification(params.plotId);
    const status = applyReviewClearanceGate({
      proposedStatus: params.proposedStatus,
      currentStatus,
      clearanceVerifiedGroundTruthPhotoCount: groundTruthPhotos.clearanceVerifiedCount,
      contextAutoClear: params.contextAutoClear,
    });
    return {
      status,
      reviewClearanceBlocked: status === 'under_review' && params.proposedStatus === 'deforestation_clear',
      groundTruthPhotos,
    };
  }

  private async getPlotScreeningContext(plotId: string): Promise<{
    countryCode: string | null;
    mainCommodity: string | null;
  }> {
    try {
      const res = await this.pool.query<{
        country_code: string | null;
        main_commodity: string | null;
      }>(
        `
          SELECT
            fp.country_code,
            tcp.main_commodity
          FROM plot p
          JOIN farmer_profile fp ON fp.id = p.farmer_id
          LEFT JOIN tenant_signup_contacts tsc
            ON tsc.user_id = fp.user_id::text
          LEFT JOIN tenant_commercial_profiles tcp
            ON tcp.tenant_id = tsc.tenant_id
          WHERE p.id = $1
          ORDER BY tcp.updated_at DESC NULLS LAST
          LIMIT 1
        `,
        [plotId],
      );
      if (res.rowCount === 0) {
        return { countryCode: null, mainCommodity: null };
      }
      const row = res.rows[0];
      return {
        countryCode: typeof row.country_code === 'string' ? row.country_code.toUpperCase() : null,
        mainCommodity: typeof row.main_commodity === 'string' ? row.main_commodity : null,
      };
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        const fallback = await this.pool.query<{ country_code: string | null }>(
          `
            SELECT fp.country_code
            FROM plot p
            JOIN farmer_profile fp ON fp.id = p.farmer_id
            WHERE p.id = $1
            LIMIT 1
          `,
          [plotId],
        );
        return {
          countryCode:
            typeof fallback.rows[0]?.country_code === 'string'
              ? fallback.rows[0].country_code.toUpperCase()
              : null,
          mainCommodity: null,
        };
      }
      throw error;
    }
  }

  private buildCommodityContextSnapshot(
    screening: FdpCommodityScreening,
  ): DeforestationScreeningCommodityContextSnapshot {
    return buildFdpContextSnapshot(screening);
  }

  private async getPlotOverlapFlags(plotId: string): Promise<{
    sinaph_overlap: boolean;
    indigenous_overlap: boolean;
  }> {
    const res = await this.pool.query(
      `
        SELECT sinaph_overlap, indigenous_overlap
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    const row = res.rows[0];
    return {
      sinaph_overlap: row.sinaph_overlap === true,
      indigenous_overlap: row.indigenous_overlap === true,
    };
  }

  private buildContextSnapshot(context: GfwContextScreening): DeforestationScreeningContextSnapshot {
    return {
      signal: context.signal,
      tropicalTreeCoverAvgPct: context.summary.tropicalTreeCoverAvgPct,
      tropicalTreeCoverAreaHa: context.summary.tropicalTreeCoverAreaHa,
      treeCoverLossHa: context.summary.treeCoverLossHa,
      naturalForestHa: context.summary.naturalForestHa,
      layers: context.layers.map((layer) => ({
        dataset: layer.dataset,
        version: layer.version,
        ok: layer.ok,
        error: layer.error,
      })),
      queriedAt: context.queriedAt,
    };
  }

  private buildDeforestationScreeningSnapshot(params: {
    summary: GfwAlertSummary;
    signalTier: ReturnType<typeof gfwSummaryToSignalTier>;
    screening: {
      cutoffDate: string;
      usedFallback: boolean;
      gfwResult: Record<string, unknown>;
      context?: GfwContextScreening;
      contextAdjusted?: boolean;
      commodity?: FdpCommodityScreening;
      commodityAdjusted?: boolean;
    };
  }): DeforestationScreeningSnapshot {
    return {
      cutoffDate: params.screening.cutoffDate,
      alertCount: params.summary.alertCount,
      alertAreaHa: params.summary.alertAreaHa,
      signalTier: params.signalTier,
      providerMode: params.screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
      dataset: typeof params.screening.gfwResult.dataset === 'string' ? params.screening.gfwResult.dataset : null,
      version: typeof params.screening.gfwResult.version === 'string' ? params.screening.gfwResult.version : null,
      screenedAt: new Date().toISOString(),
      context: params.screening.context ? this.buildContextSnapshot(params.screening.context) : undefined,
      contextAdjusted: params.screening.contextAdjusted === true,
      commodityContext: params.screening.commodity
        ? this.buildCommodityContextSnapshot(params.screening.commodity)
        : undefined,
      commodityAdjusted: params.screening.commodityAdjusted === true,
      fdpModelVersion: params.screening.commodity?.summary.ok ? '2025b' : null,
    };
  }

  private async persistPlotComplianceStatus(
    plotId: string,
    status: PlotComplianceStatus,
    screening?: DeforestationScreeningSnapshot | null,
  ): Promise<void> {
    if (screening) {
      await this.pool.query(
        `
          UPDATE plot
          SET status = $2,
              deforestation_screening = $3::jsonb,
              updated_at = NOW()
          WHERE id = $1
        `,
        [plotId, status, JSON.stringify(screening)],
      );
      return;
    }

    await this.pool.query(
      `
        UPDATE plot
        SET status = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [plotId, status],
    );
  }

  private async queryGfwAlertsForGeometry(
    geometry: any,
    cutoffDate: string = EUDR_DEFORESTATION_CUTOFF,
    screeningContext?: {
      countryCode: string | null;
      mainCommodity: string | null;
    },
  ): Promise<{
    summary: GfwAlertSummary;
    gfwResult: Record<string, unknown>;
    usedFallback: boolean;
    cutoffDate: string;
    historicalSqlApplied: boolean;
    context: GfwContextScreening;
    commodity: FdpCommodityScreening;
  }> {
    const [alertsOutcome, context, commodity] = await Promise.all([
      (async () => {
        let gfwResult: Record<string, unknown> = await this.gfw.runHistoricalDeforestationQuery({
          geometry,
          cutoffDate,
        });
        let summary = this.normalizeGfwResult(gfwResult.result);
        let usedFallback = false;
        if (summary.alertCount == null) {
          gfwResult = {
            ...(await this.gfw.runRaddFallback({ geometry, cutoffDate })),
            cutoffDate,
          };
          summary = this.normalizeGfwResult(gfwResult.result);
          usedFallback = true;
        }

        return {
          summary,
          gfwResult,
          usedFallback,
          historicalSqlApplied: Boolean(gfwResult.historicalSqlApplied),
        };
      })(),
      this.gfwContext.queryForGeometry(geometry, cutoffDate),
      this.fdpCommodity.queryForGeometry({
        geometry,
        countryCode: screeningContext?.countryCode ?? null,
        commodity: screeningContext?.mainCommodity ?? null,
      }),
    ]);

    return {
      ...alertsOutcome,
      cutoffDate,
      context,
      commodity,
    };
  }

  private resolveMergedPlotStatus(params: {
    gfwSummary: GfwAlertSummary;
    sinaphOverlap: boolean;
    indigenousOverlap: boolean;
    productionSystem?: string | null;
    context?: GfwContextScreening;
    commodity?: FdpCommodityScreening;
  }): {
    status: PlotComplianceStatus;
    contextAdjusted: boolean;
    commodityAdjusted: boolean;
  } {
    const alertStatus = gfwSummaryToPlotStatus(params.gfwSummary);
    const contextAdjustedStatus = params.context
      ? applyGfwContextToPlotStatus({
          alertSummary: params.gfwSummary,
          context: params.context.summary,
          contextSignal: params.context.signal,
          productionSystem: params.productionSystem,
          baseStatus: alertStatus,
        })
      : alertStatus;

    const fdpAdjustedStatus = params.commodity
      ? applyFdpCommodityToPlotStatus({
          fdpSignal: params.commodity.signal,
          productionSystem: params.productionSystem,
          baseStatus: contextAdjustedStatus,
        })
      : contextAdjustedStatus;

    return {
      status: mergePlotComplianceStatus(
        fdpAdjustedStatus,
        overlapToPlotStatus(params.sinaphOverlap, params.indigenousOverlap),
      ),
      contextAdjusted: contextAdjustedStatus !== alertStatus,
      commodityAdjusted: fdpAdjustedStatus !== contextAdjustedStatus,
    };
  }

  async runGfwCheck(plotId: string, userId: string | undefined) {
    const geometry = await this.getPlotGeometryForCompliance(plotId);
    const overlaps = await this.getPlotOverlapFlags(plotId);
    const plotMeta = await this.getPlotStatusRow(plotId);
    const screeningContext = await this.getPlotScreeningContext(plotId);

    try {
      const screening = await this.queryGfwAlertsForGeometry(
        geometry,
        EUDR_DEFORESTATION_CUTOFF,
        screeningContext,
      );
      const signalTier = gfwSummaryToSignalTier(screening.summary);
      const mergeResult = this.resolveMergedPlotStatus({
        gfwSummary: screening.summary,
        sinaphOverlap: overlaps.sinaph_overlap,
        indigenousOverlap: overlaps.indigenous_overlap,
        productionSystem: plotMeta.production_system,
        context: screening.context,
        commodity: screening.commodity,
      });
      const contextAutoClear = screeningSupportsAutoReviewClear({
        gfwContextSignal: screening.context.signal,
        fdpSignal: screening.commodity.signal,
        productionSystem: plotMeta.production_system,
        proposedStatus: mergeResult.status,
      });
      const finalized = await this.finalizePlotComplianceStatus({
        plotId,
        proposedStatus: mergeResult.status,
        gfwSummary: screening.summary,
        contextAutoClear,
        currentStatus: plotMeta.status,
      });
      const plotStatus = finalized.status;

      const screeningSnapshot = this.buildDeforestationScreeningSnapshot({
        summary: screening.summary,
        signalTier,
        screening: {
          cutoffDate: screening.cutoffDate,
          usedFallback: screening.usedFallback,
          gfwResult: screening.gfwResult,
          context: screening.context,
          contextAdjusted: mergeResult.contextAdjusted,
          commodity: screening.commodity,
          commodityAdjusted: mergeResult.commodityAdjusted,
        },
      });

      await this.persistPlotComplianceStatus(plotId, plotStatus, screeningSnapshot);

      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          userId ?? null,
          'gfw_check_run',
          JSON.stringify({
            plotId,
            provider: 'gfw',
            providerMode: screeningSnapshot.providerMode,
            cutoffDate: screening.cutoffDate,
            plotStatus,
            proposedStatus: mergeResult.status,
            contextAdjusted: mergeResult.contextAdjusted,
            contextSignal: screening.context.signal,
            commodityAdjusted: mergeResult.commodityAdjusted,
            fdpSignal: screening.commodity.signal,
            fdpModelVersion: screening.commodity.summary.ok ? '2025b' : null,
            contextAutoClear,
            reviewClearanceBlocked: finalized.reviewClearanceBlocked,
            groundTruthPhotos: finalized.groundTruthPhotos,
            screening: screeningSnapshot,
            summary: {
              status: signalTier,
              alertCount: screening.summary.alertCount,
              alertAreaHa: screening.summary.alertAreaHa,
            },
            ...screening.gfwResult,
            historicalSqlApplied: screening.historicalSqlApplied,
            runAt: new Date().toISOString(),
          }),
        ],
      );

      return {
        ok: true,
        plotStatus,
        reviewClearanceBlocked: finalized.reviewClearanceBlocked,
        groundTruthPhotos: finalized.groundTruthPhotos,
        contextAdjusted: mergeResult.contextAdjusted,
        contextSignal: screening.context.signal,
        commodityAdjusted: mergeResult.commodityAdjusted,
        fdpSignal: screening.commodity.signal,
        usedFallback: screening.usedFallback,
        cutoffDate: screening.cutoffDate,
        summary: { status: signalTier, ...screening.summary },
        ...screening.gfwResult,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          userId ?? null,
          'gfw_check_failed',
          JSON.stringify({
            plotId,
            provider: 'gfw',
            cutoffDate: EUDR_DEFORESTATION_CUTOFF,
            error: message,
            runAt: new Date().toISOString(),
          }),
        ],
      );

      return {
        ok: false,
        plotStatus: 'pending_check' as const,
        error: message,
        cutoffDate: EUDR_DEFORESTATION_CUTOFF,
      };
    }
  }

  async runDeforestationDecision(plotId: string, userId: string | undefined, cutoffDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) {
      throw new BadRequestException('Invalid cutoffDate. Use YYYY-MM-DD.');
    }
    const cutoffAsDate = new Date(`${cutoffDate}T00:00:00.000Z`);
    if (Number.isNaN(cutoffAsDate.getTime())) {
      throw new BadRequestException('Invalid cutoffDate. Use YYYY-MM-DD.');
    }

    const geometry = await this.getPlotGeometryForCompliance(plotId);
    const overlaps = await this.getPlotOverlapFlags(plotId);
    const plotMeta = await this.getPlotStatusRow(plotId);
    const screeningContext = await this.getPlotScreeningContext(plotId);
    const screening = await this.queryGfwAlertsForGeometry(geometry, cutoffDate, screeningContext);

    const verdict =
      screening.summary.alertCount == null
        ? 'unknown'
        : screening.summary.alertCount === 0
          ? 'no_deforestation_detected'
          : 'possible_deforestation_detected';

    const mergeResult = this.resolveMergedPlotStatus({
      gfwSummary: screening.summary,
      sinaphOverlap: overlaps.sinaph_overlap,
      indigenousOverlap: overlaps.indigenous_overlap,
      productionSystem: plotMeta.production_system,
      context: screening.context,
      commodity: screening.commodity,
    });
    const proposedStatus = verdict === 'unknown' ? ('pending_check' as const) : mergeResult.status;
    const contextAutoClear = screeningSupportsAutoReviewClear({
      gfwContextSignal: screening.context.signal,
      fdpSignal: screening.commodity.signal,
      productionSystem: plotMeta.production_system,
      proposedStatus,
    });
    const finalized = await this.finalizePlotComplianceStatus({
      plotId,
      proposedStatus,
      gfwSummary: screening.summary,
      contextAutoClear,
      currentStatus: plotMeta.status,
    });
    const plotStatus = finalized.status;

    const signalTier = gfwSummaryToSignalTier(screening.summary);
    const screeningSnapshot = this.buildDeforestationScreeningSnapshot({
      summary: screening.summary,
      signalTier,
      screening: {
        cutoffDate: screening.cutoffDate,
        usedFallback: screening.usedFallback,
        gfwResult: screening.gfwResult,
        context: screening.context,
        contextAdjusted: mergeResult.contextAdjusted,
        commodity: screening.commodity,
        commodityAdjusted: mergeResult.commodityAdjusted,
      },
    });

    await this.persistPlotComplianceStatus(plotId, plotStatus, screeningSnapshot);

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_deforestation_decision_recorded',
        JSON.stringify({
          ...screening.gfwResult,
          plotId,
          provider: 'gfw',
          providerMode: screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
          cutoffDate,
          verdict,
          plotStatus,
          commodityAdjusted: mergeResult.commodityAdjusted,
          fdpSignal: screening.commodity.signal,
          fdpModelVersion: screening.commodity.summary.ok ? '2025b' : null,
          screening: screeningSnapshot,
          summary: {
            alertCount: screening.summary.alertCount,
            alertAreaHa: screening.summary.alertAreaHa,
          },
          historicalSqlApplied: screening.historicalSqlApplied,
          runAt: new Date().toISOString(),
        }),
      ],
    );

    return {
      ok: true,
      plotId,
      cutoffDate,
      verdict,
      plotStatus,
      usedFallback: screening.usedFallback,
      summary: {
        alertCount: screening.summary.alertCount,
        alertAreaHa: screening.summary.alertAreaHa,
      },
      historicalSqlApplied: screening.historicalSqlApplied,
      provider: 'gfw',
      providerMode: screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
      source: {
        dataset: screening.gfwResult.dataset ?? null,
        version: screening.gfwResult.version ?? null,
      },
    };
  }

  async getComplianceHistory(plotId: string) {
    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('gfw_check_run', 'plot_compliance_checked', 'plot_photos_synced', 'plot_legal_synced', 'plot_edited')
        ORDER BY timestamp DESC
        LIMIT 50
      `,
      [plotId],
    );
    return res.rows;
  }

  async getDeforestationDecisionHistory(plotId: string) {
    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM (
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type = 'plot_deforestation_decision_recorded'
          UNION
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type = 'plot_deforestation_decision_recorded'
        ) decision_rows
        ORDER BY timestamp DESC
        LIMIT 100
      `,
      [plotId],
    );
    return res.rows;
  }

  async getGeometryHistory(
    plotId: string,
    limit = 100,
    offset = 0,
    sort: 'desc' | 'asc' = 'desc',
    anomalyProfile: 'strict' | 'balanced' | 'lenient' = 'balanced',
    signalsOnly = false,
  ): Promise<PlotGeometryHistoryPage> {
    const normalizedAnomalyProfile =
      anomalyProfile === 'strict' || anomalyProfile === 'lenient' ? anomalyProfile : 'balanced';

    const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.trunc(limit))) : 100;
    const boundedOffset = Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : 0;
    const normalizedSort = sort === 'asc' ? 'asc' : 'desc';
    const orderDirectionSql = normalizedSort === 'asc' ? 'ASC' : 'DESC';

    const mapRowToEvent = (row: any) => {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      const eventType: 'plot_created' | 'plot_geometry_superseded' =
        row.event_type === 'plot_geometry_superseded' ? 'plot_geometry_superseded' : 'plot_created';
      return {
        id: String(row.id),
        timestamp:
          row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : new Date(row.timestamp).toISOString(),
        userId: row.user_id ? String(row.user_id) : null,
        deviceId: row.device_id ? String(row.device_id) : null,
        eventType,
        payload: {
          plotId: String((payload as Record<string, unknown>).plotId ?? plotId),
          details: payload as Record<string, unknown>,
        },
      };
    };

    if (signalsOnly) {
      const fullRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type IN ('plot_created', 'plot_geometry_superseded')
          ORDER BY timestamp ${orderDirectionSql}
        `,
        [plotId],
      );
      const allItems = fullRes.rows.map(mapRowToEvent);
      const anomalies = PlotsService.computeGeometryHistoryAnomalies(allItems, normalizedAnomalyProfile);
      const anomalyIds = new Set(anomalies.map((anomaly) => anomaly.eventId));
      const filteredItems = allItems.filter((item) => anomalyIds.has(item.id));
      const pagedItems = filteredItems.slice(boundedOffset, boundedOffset + boundedLimit);

      return {
        items: pagedItems,
        anomalies,
        total: filteredItems.length,
        limit: boundedLimit,
        offset: boundedOffset,
        sort: normalizedSort,
        anomalyProfile: normalizedAnomalyProfile,
        signalsOnly: true,
        anomalySummary: PlotsService.summarizeGeometryHistoryAnomalies(anomalies),
        anomalySummaryScope: 'full_filtered_set',
      };
    }

    const countRes = await this.pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('plot_created', 'plot_geometry_superseded')
      `,
      [plotId],
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('plot_created', 'plot_geometry_superseded')
        ORDER BY timestamp ${orderDirectionSql}
        LIMIT $2
        OFFSET $3
      `,
      [plotId, boundedLimit, boundedOffset],
    );
    const items = res.rows.map(mapRowToEvent);
    const anomalies = PlotsService.computeGeometryHistoryAnomalies(items, normalizedAnomalyProfile);
    return {
      items,
      anomalies,
      total,
      limit: boundedLimit,
      offset: boundedOffset,
      sort: normalizedSort,
      anomalyProfile: normalizedAnomalyProfile,
      signalsOnly: false,
      anomalySummary: PlotsService.summarizeGeometryHistoryAnomalies(anomalies),
      anomalySummaryScope: 'current_page',
    };
  }

  async listByFarmer(farmerId: string) {
    const hasClientPlotId = await this.plotHasClientPlotIdColumn();
    const result = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          name,
          ${hasClientPlotId ? 'client_plot_id,' : ''}
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          sinaph_overlap,
          indigenous_overlap,
          production_system,
          deforestation_screening,
          status,
          created_at,
          ST_AsGeoJSON(geometry) AS geometry_geojson
        FROM plot
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    return result.rows.map((row) => {
      const raw = row as Record<string, unknown> & {
        geometry_geojson?: string | null;
        id: string;
      };
      const { geometry_geojson, ...rest } = raw;
      let geometry: Record<string, unknown> | null = null;
      if (typeof geometry_geojson === 'string' && geometry_geojson.trim()) {
        try {
          geometry = JSON.parse(geometry_geojson) as Record<string, unknown>;
        } catch {
          geometry = null;
        }
      }
      return { ...rest, geometry };
    });
  }

  async listForTenant(
    tenantId: string,
    canAccessPlot?: (plotId: string, farmerId: string) => Promise<boolean>,
  ) {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `
        SELECT
          p.id,
          p.farmer_id,
          p.name,
          p.kind,
          p.area_ha,
          p.declared_area_ha,
          p.precision_m_at_capture,
          p.sinaph_overlap,
          p.indigenous_overlap,
          p.status,
          p.created_at,
          COALESCE(cc.full_name, ua.name, LEFT(fp.id::text, 8)) AS farmer_name
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        LEFT JOIN LATERAL (
          SELECT full_name
          FROM crm_contacts
          WHERE farmer_profile_id = fp.id
          ORDER BY updated_at DESC
          LIMIT 1
        ) cc ON TRUE
        WHERE p.farmer_id = ANY($1::uuid[])
        ORDER BY p.created_at DESC
      `,
      [farmerIds],
    );

    if (!canAccessPlot) {
      return result.rows;
    }

    const allowed: typeof result.rows = [];
    for (const row of result.rows) {
      if (await canAccessPlot(row.id as string, row.farmer_id as string)) {
        allowed.push(row);
      }
    }
    return allowed;
  }

  async getPlotTenantScope(plotId: string): Promise<{ farmerId: string }> {
    const res = await this.pool.query(
      `
        SELECT farmer_id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    return { farmerId: res.rows[0].farmer_id as string };
  }

  async getPlotMapPreview(plotId: string) {
    const hasGeometryCapture = await this.plotHasGeometryCaptureColumn();
    const geometryCaptureSelect = hasGeometryCapture
      ? 'p.geometry_capture'
      : 'NULL::jsonb AS geometry_capture';

    const res = await this.pool.query(
      `
        SELECT
          p.id,
          p.farmer_id,
          p.name,
          p.kind,
          p.area_ha,
          p.declared_area_ha,
          p.status,
          ${geometryCaptureSelect},
          ST_AsGeoJSON(p.geometry) AS geometry_geojson,
          COALESCE(cc.full_name, ua.name, LEFT(fp.id::text, 8)) AS farmer_name
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        LEFT JOIN LATERAL (
          SELECT full_name
          FROM crm_contacts
          WHERE farmer_profile_id = fp.id
          ORDER BY updated_at DESC
          LIMIT 1
        ) cc ON TRUE
        WHERE p.id = $1
      `,
      [plotId],
    );

    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const row = res.rows[0];
    let geometry: Record<string, unknown> | null = null;
    if (row.geometry_geojson) {
      try {
        geometry = JSON.parse(row.geometry_geojson as string);
      } catch {
        geometry = null;
      }
    }

    const areaRaw = row.area_ha ?? row.declared_area_ha;
    const areaHa =
      typeof areaRaw === 'number'
        ? areaRaw
        : typeof areaRaw === 'string'
          ? Number(areaRaw)
          : null;

    const groundTruthPhotos = await this.getGroundTruthPhotoVerification(plotId);

    return {
      id: row.id as string,
      farmer_id: row.farmer_id as string,
      farmer_name: typeof row.farmer_name === 'string' ? row.farmer_name : null,
      name: typeof row.name === 'string' ? row.name : `Plot ${String(row.id).slice(0, 8)}`,
      kind: row.kind as string,
      area_ha: Number.isFinite(areaHa) ? areaHa : null,
      status: row.status as string,
      geometry,
      geometry_capture: row.geometry_capture ?? null,
      ground_truth_photos: {
        clearance_verified_count: groundTruthPhotos.clearanceVerifiedCount,
        min_required: groundTruthPhotos.minRequired,
        clearance_eligible: groundTruthPhotos.clearanceEligible,
        total_count: groundTruthPhotos.totalCount,
      },
    };
  }

  async listReviewQueue(
    tenantId: string,
    canAccessPlot?: (plotId: string) => Promise<boolean>,
  ) {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `
        SELECT
          p.id,
          p.farmer_id,
          p.name,
          p.kind,
          p.area_ha,
          p.status,
          p.production_system,
          p.deforestation_screening,
          p.sinaph_overlap,
          p.indigenous_overlap,
          p.updated_at,
          COALESCE(ua.name, LEFT(fp.id::text, 8)) AS farmer_name
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        WHERE p.farmer_id = ANY($1::uuid[])
          AND p.status IN ('under_review', 'degradation_risk', 'deforestation_detected')
        ORDER BY
          CASE p.status
            WHEN 'deforestation_detected' THEN 0
            WHEN 'degradation_risk' THEN 1
            ELSE 2
          END,
          p.updated_at DESC
      `,
      [farmerIds],
    );

    const scopedRows = canAccessPlot
      ? (
          await Promise.all(
            result.rows.map(async (row) => ({
              row,
              allowed: await canAccessPlot(row.id as string),
            })),
          )
        )
          .filter((entry) => entry.allowed)
          .map((entry) => entry.row)
      : result.rows;

    const items = await Promise.all(
      scopedRows.map(async (row) => {
        const groundTruthPhotos = await this.getGroundTruthPhotoVerification(row.id);
        return {
          ...row,
          reviewPriority:
            row.status === 'deforestation_detected'
              ? 'high'
              : row.status === 'degradation_risk'
                ? 'medium'
                : 'low',
          autoClearanceEligible: groundTruthPhotos.clearanceEligible,
          groundTruthPhotos,
        };
      }),
    );

    return items;
  }

  async listGeometryRemediationQueue(tenantId: string, limit = 50) {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return { total: 0, items: [] as Array<Record<string, unknown>> };
    }

    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 200) : 50;

    try {
      const res = await this.pool.query(
        `
          SELECT id, timestamp, user_id, payload
          FROM audit_log
          WHERE event_type = 'plot_geometry_quality_checked'
            AND COALESCE((payload->>'ok')::boolean, false) = false
            AND payload->>'farmerId' = ANY($1::text[])
          ORDER BY timestamp DESC
          LIMIT $2
        `,
        [farmerIds, safeLimit],
      );

      const items = res.rows.map((row) => {
        const payload =
          row.payload && typeof row.payload === 'object'
            ? (row.payload as Record<string, unknown>)
            : {};
        const issues = Array.isArray(payload.issues) ? payload.issues : [];
        const blocking = issues.find(
          (issue) =>
            issue &&
            typeof issue === 'object' &&
            (issue as { severity?: string }).severity === 'error',
        ) as { code?: string; message?: string; details?: Record<string, unknown> } | undefined;

        return {
          id: row.id,
          timestamp: row.timestamp,
          userId: row.user_id,
          farmerId: payload.farmerId ?? null,
          clientPlotId: payload.clientPlotId ?? null,
          plotId: payload.plotId ?? null,
          phase: payload.phase ?? null,
          code: blocking?.code ?? null,
          message: blocking?.message ?? 'Boundary rejected during upload.',
          details: blocking?.details ?? null,
          issues,
          metrics: payload.metrics ?? null,
        };
      });

      return { total: items.length, items };
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return { total: 0, items: [] };
      }
      throw error;
    }
  }

  async clearPlotReview(
    plotId: string,
    params: { reason: string; note?: string | null },
    userId: string | undefined,
  ) {
    const { status: currentStatus } = await this.getPlotStatusRow(plotId);
    if (
      currentStatus !== 'under_review' &&
      currentStatus !== 'degradation_risk' &&
      currentStatus !== 'deforestation_detected'
    ) {
      throw new BadRequestException('Plot is not in a reviewable status');
    }

    await this.pool.query(
      `
        UPDATE plot
        SET status = 'deforestation_clear',
            updated_at = NOW()
        WHERE id = $1
      `,
      [plotId],
    );

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_review_cleared',
        JSON.stringify({
          plotId,
          previousStatus: currentStatus,
          newStatus: 'deforestation_clear',
          reason: params.reason,
          note: params.note ?? null,
          clearedAt: new Date().toISOString(),
        }),
      ],
    );

    return { ok: true, plotId, plotStatus: 'deforestation_clear' as const, previousStatus: currentStatus };
  }

  async upholdPlotReview(
    plotId: string,
    params: { reason: string; note?: string | null },
    userId: string | undefined,
  ) {
    const { status: currentStatus } = await this.getPlotStatusRow(plotId);
    if (
      currentStatus !== 'under_review' &&
      currentStatus !== 'degradation_risk' &&
      currentStatus !== 'deforestation_detected'
    ) {
      throw new BadRequestException('Plot is not in a reviewable status');
    }

    const nextStatus: PlotComplianceStatus =
      currentStatus === 'under_review' ? 'deforestation_detected' : currentStatus;

    if (nextStatus !== currentStatus) {
      await this.pool.query(
        `
          UPDATE plot
          SET status = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [plotId, nextStatus],
      );
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_review_upheld',
        JSON.stringify({
          plotId,
          previousStatus: currentStatus,
          newStatus: nextStatus,
          reason: params.reason,
          note: params.note ?? null,
          upheldAt: new Date().toISOString(),
        }),
      ],
    );

    return { ok: true, plotId, plotStatus: nextStatus, previousStatus: currentStatus };
  }

  async isFarmerOwnedByUser(farmerId: string, userId: string): Promise<boolean> {
    return isFarmerProfileOwnedByUser(this.pool, farmerId, userId);
  }

  async isPlotOwnedByUser(plotId: string, userId: string): Promise<boolean> {
    const res = await this.pool.query(
      `
        SELECT 1
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        WHERE p.id = $1
          AND fp.user_id = $2
        LIMIT 1
      `,
      [plotId, userId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async isAgentAssignedToPlot(plotId: string, agentUserId: string, assignmentId?: string): Promise<boolean> {
    try {
      const res = await this.pool.query(
        `
          SELECT 1
          FROM agent_plot_assignment apa
          WHERE apa.plot_id = $1
            AND apa.agent_user_id = $2
            AND apa.status = 'active'
            AND ($3::text IS NULL OR apa.assignment_id = $3)
          LIMIT 1
        `,
        [plotId, agentUserId, assignmentId ?? null],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (error: any) {
      // Fail closed until canonical assignment relation is provisioned.
      if (error?.code === '42P01') {
        return false;
      }
      throw error;
    }
  }

  async createAssignment(plotId: string, assignmentId: string, agentUserId: string): Promise<PlotAssignmentRow> {
    try {
      const res = await this.pool.query<PlotAssignmentRow>(
        `
          INSERT INTO agent_plot_assignment (assignment_id, agent_user_id, plot_id, status)
          VALUES ($1, $2, $3, 'active')
          RETURNING
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
        `,
        [assignmentId, agentUserId, plotId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('ASN-001: Failed to create assignment.');
      }
      return res.rows[0];
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException('ASN-001: Assignment already active for this plot/agent scope.');
      }
      if (error?.code === '42P01') {
        throw new BadRequestException('ASN-004: Assignment relation not provisioned.');
      }
      throw error;
    }
  }

  async listAssignmentsByPlot(
    plotId: string,
    options?: {
      status?: 'all' | 'active' | 'completed' | 'cancelled';
      fromDays?: number;
      agentUserId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<PlotAssignmentListPage> {
    const status = options?.status ?? 'all';
    const fromDays = Number.isFinite(options?.fromDays) ? Math.max(1, Math.trunc(options!.fromDays!)) : 30;
    const limit = Number.isFinite(options?.limit) ? Math.min(100, Math.max(1, Math.trunc(options!.limit!))) : 20;
    const offset = Number.isFinite(options?.offset) ? Math.max(0, Math.trunc(options!.offset!)) : 0;
    const agentUserId = options?.agentUserId?.trim() ? options.agentUserId.trim() : null;
    try {
      const totalRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM agent_plot_assignment
          WHERE plot_id = $1
            AND ($2::text = 'all' OR status = $2)
            AND ($3::uuid IS NULL OR agent_user_id = $3::uuid)
            AND assigned_at >= (NOW() - make_interval(days => $4::int))
        `,
        [plotId, status, agentUserId, fromDays],
      );
      const res = await this.pool.query<PlotAssignmentListItem>(
        `
          SELECT
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            ua.name AS "agentName",
            to_jsonb(ua)->>'email' AS "agentEmail",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
          FROM agent_plot_assignment
          LEFT JOIN user_account ua ON ua.id = agent_plot_assignment.agent_user_id
          WHERE plot_id = $1
            AND ($2::text = 'all' OR status = $2)
            AND ($3::uuid IS NULL OR agent_user_id = $3::uuid)
            AND assigned_at >= (NOW() - make_interval(days => $4::int))
          ORDER BY assigned_at DESC
          LIMIT $5
          OFFSET $6
        `,
        [plotId, status, agentUserId, fromDays, limit, offset],
      );
      return {
        items: res.rows,
        total: totalRes.rows[0]?.total ?? 0,
        limit,
        offset,
        status,
        fromDays,
        agentUserId,
      };
    } catch (error: any) {
      if (error?.code === '42P01') {
        return {
          items: [],
          total: 0,
          limit,
          offset,
          status,
          fromDays,
          agentUserId,
        };
      }
      throw error;
    }
  }

  async appendAssignmentExportAuditEvent(event: PlotAssignmentExportAuditEvent): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        event.userId ?? null,
        `plot_assignment_export_${event.phase}`,
        JSON.stringify({
          plotId: event.plotId,
          tenantId: event.tenantId ?? null,
          exportedBy: event.exportedBy ?? null,
          rowCount: event.rowCount ?? null,
          status: event.filters.status,
          fromDays: event.filters.fromDays,
          agentUserId: event.filters.agentUserId,
          error: event.error ?? null,
        }),
      ],
    );
  }

  async completeAssignment(assignmentId: string): Promise<PlotAssignmentRow> {
    return this.transitionAssignmentStatus(assignmentId, 'completed');
  }

  async cancelAssignment(assignmentId: string): Promise<PlotAssignmentRow> {
    return this.transitionAssignmentStatus(assignmentId, 'cancelled');
  }

  private async transitionAssignmentStatus(
    assignmentId: string,
    nextStatus: 'completed' | 'cancelled',
  ): Promise<PlotAssignmentRow> {
    try {
      const res = await this.pool.query<PlotAssignmentRow>(
        `
          UPDATE agent_plot_assignment
          SET status = $2,
              ended_at = NOW(),
              updated_at = NOW()
          WHERE assignment_id = $1
            AND status = 'active'
          RETURNING
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
        `,
        [assignmentId, nextStatus],
      );

      if ((res.rowCount ?? 0) > 0) {
        return res.rows[0];
      }

      const existing = await this.pool.query<{ status: string }>(
        `SELECT status FROM agent_plot_assignment WHERE assignment_id = $1 LIMIT 1`,
        [assignmentId],
      );
      if ((existing.rowCount ?? 0) === 0) {
        throw new BadRequestException('ASN-002: Assignment not found.');
      }
      throw new BadRequestException(
        `ASN-003: Invalid assignment state transition from ${existing.rows[0].status} to ${nextStatus}.`,
      );
    } catch (error: any) {
      if (error?.code === '42P01') {
        throw new BadRequestException('ASN-004: Assignment relation not provisioned.');
      }
      throw error;
    }
  }

  async runComplianceCheck(plotId: string) {
    const plotRes = await this.pool.query(
      `
        SELECT id, area_ha, geometry, production_system
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (plotRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const row = plotRes.rows[0];

    const overlapRes = await this.pool.query(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM sinaph_zone sz
            WHERE ST_Intersects(
              sz.geometry,
              ST_Buffer($1::geography, 50)::geometry -- 50m buffer around plot
            )
          ) AS sinaph_overlap,
          EXISTS (
            SELECT 1
            FROM indigenous_zone iz
            WHERE ST_Intersects(
              iz.geometry,
              ST_Buffer($1::geography, 50)::geometry
            )
          ) AS indigenous_overlap
      `,
      [row.geometry],
    );

    const overlaps = overlapRes.rows[0] ?? {
      sinaph_overlap: false,
      indigenous_overlap: false,
    };

    let gfwSummary: GfwAlertSummary = { alertCount: null, alertAreaHa: null };
    let gfwSignalTier: ReturnType<typeof gfwSummaryToSignalTier> = 'unknown';
    let gfwProviderMode: 'glad_s2_primary' | 'radd_fallback' | 'unavailable' = 'unavailable';
    let gfwError: string | null = null;
    let contextScreening: GfwContextScreening | null = null;
    let commodityScreening: FdpCommodityScreening | null = null;
    let contextAdjusted = false;
    let commodityAdjusted = false;
    const productionSystem =
      typeof row.production_system === 'string' ? row.production_system : null;

    try {
      const geometry = await this.getPlotGeometryForCompliance(plotId);
      const screeningContext = await this.getPlotScreeningContext(plotId);
      const screening = await this.queryGfwAlertsForGeometry(
        geometry,
        EUDR_DEFORESTATION_CUTOFF,
        screeningContext,
      );
      gfwSummary = screening.summary;
      gfwSignalTier = gfwSummaryToSignalTier(screening.summary);
      gfwProviderMode = screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary';
      contextScreening = screening.context;
      commodityScreening = screening.commodity;
    } catch (error) {
      gfwError = error instanceof Error ? error.message : String(error);
    }

    const mergeResult = this.resolveMergedPlotStatus({
      gfwSummary,
      sinaphOverlap: overlaps.sinaph_overlap === true,
      indigenousOverlap: overlaps.indigenous_overlap === true,
      productionSystem,
      context: contextScreening ?? undefined,
      commodity: commodityScreening ?? undefined,
    });
    contextAdjusted = mergeResult.contextAdjusted;
    commodityAdjusted = mergeResult.commodityAdjusted;
    const contextAutoClear = screeningSupportsAutoReviewClear({
      gfwContextSignal: contextScreening?.signal ?? 'unknown',
      fdpSignal: commodityScreening?.signal,
      productionSystem,
      proposedStatus: mergeResult.status,
    });
    const finalized = await this.finalizePlotComplianceStatus({
      plotId,
      proposedStatus: mergeResult.status,
      gfwSummary,
      contextAutoClear,
    });
    const status = finalized.status;

    const screeningSnapshot =
      gfwSignalTier !== 'unknown'
        ? this.buildDeforestationScreeningSnapshot({
            summary: gfwSummary,
            signalTier: gfwSignalTier,
            screening: {
              cutoffDate: EUDR_DEFORESTATION_CUTOFF,
              usedFallback: gfwProviderMode === 'radd_fallback',
              gfwResult: {
                dataset: process.env.GFW_DATASET ?? 'gfw_integrated_alerts',
                version: process.env.GFW_VERSION ?? 'latest',
              },
              context: contextScreening ?? undefined,
              contextAdjusted,
              commodity: commodityScreening ?? undefined,
              commodityAdjusted,
            },
          })
        : null;

    const updateRes = await this.pool.query(
      `
        UPDATE plot
        SET status = $2,
            sinaph_overlap = $3,
            indigenous_overlap = $4,
            deforestation_screening = COALESCE($5::jsonb, deforestation_screening)
        WHERE id = $1
        RETURNING *
      `,
      [
        plotId,
        status,
        overlaps.sinaph_overlap,
        overlaps.indigenous_overlap,
        screeningSnapshot ? JSON.stringify(screeningSnapshot) : null,
      ],
    );

    const updated = updateRes.rows[0];

    // Audit: compliance re-check
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        null,
        'plot_compliance_checked',
        JSON.stringify({
          plotId,
          status,
          sinaphOverlap: overlaps.sinaph_overlap,
          indigenousOverlap: overlaps.indigenous_overlap,
          proposedStatus: mergeResult.status,
          contextAdjusted,
          contextSignal: contextScreening?.signal ?? 'unknown',
          contextAutoClear,
          reviewClearanceBlocked: finalized.reviewClearanceBlocked,
          groundTruthPhotos: finalized.groundTruthPhotos,
          gfw: {
            cutoffDate: EUDR_DEFORESTATION_CUTOFF,
            providerMode: gfwProviderMode,
            signalTier: gfwSignalTier,
            alertCount: gfwSummary.alertCount,
            alertAreaHa: gfwSummary.alertAreaHa,
            error: gfwError,
          },
        }),
      ],
    );

    return updated;
  }

  async updateMetadata(plotId: string, dto: UpdatePlotDto, userId: string | undefined) {
    const hasClientPlotId = await this.plotHasClientPlotIdColumn();
    const existingRes = await this.pool.query<{
      id: string;
      name: string;
      client_plot_id: string | null;
    }>(
      `
        SELECT id, name${hasClientPlotId ? ', client_plot_id' : ''}
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const existing = existingRes.rows[0];

    let updatedName = existing.name;

    if (hasClientPlotId && dto.clientPlotId?.trim() && !existing.client_plot_id?.trim()) {
      await this.pool.query(
        `
          UPDATE plot
          SET client_plot_id = $2,
              updated_at = NOW()
          WHERE id = $1
            AND client_plot_id IS NULL
        `,
        [plotId, dto.clientPlotId.trim()],
      );
    }

    if (dto.name && dto.name !== existing.name) {
      const updateRes = await this.pool.query(
        `
          UPDATE plot
          SET name = $2
          WHERE id = $1
          RETURNING name
        `,
        [plotId, dto.name],
      );

      updatedName = updateRes.rows[0]?.name ?? existing.name;
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_edited',
        JSON.stringify({
          plotId,
          oldName: existing.name,
          newName: updatedName,
          reason: dto.reason,
          deviceId: dto.deviceId ?? null,
        }),
      ],
    );

    return {
      id: plotId,
      name: updatedName,
    };
  }

  async updateGeometry(
    plotId: string,
    dto: UpdatePlotGeometryDto,
    userId: string | undefined,
    tenantId?: string | null,
  ) {
    const existingRes = await this.pool.query(
      `
        SELECT id, kind, declared_area_ha, area_ha, ST_AsGeoJSON(geometry) AS geometry_geojson
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    const existing = existingRes.rows[0] as {
      declared_area_ha: number | null;
      area_ha: number | null;
    };
    const revisionDeclaredAreaHa =
      dto.declaredAreaHa ?? existing.declared_area_ha ?? existing.area_ha ?? null;

    const ensureSixDecimals = (value: number) => Number(value.toFixed(6));
    let geometrySql: string;
    let kind: (typeof plotKindEnum.enumValues)[number];

    if (dto.geometry?.type === 'Point') {
      assertPointGeometryAllowed({
        declaredAreaHa: revisionDeclaredAreaHa,
        computedAreaHa: existing.area_ha,
      });
      const [lon, lat] = dto.geometry.coordinates.map(ensureSixDecimals) as [number, number];
      geometrySql = `ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)`;
      kind = 'point';
    } else if (dto.geometry?.type === 'Polygon') {
      const rings = dto.geometry.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new BadRequestException('Polygon must have at least one ring');
      }
      const firstRing = rings[0];
      if (firstRing.length < 4) {
        throw new BadRequestException('Polygon ring must have at least 4 vertices');
      }
      const closedRing =
        firstRing[0][0] === firstRing[firstRing.length - 1][0] &&
        firstRing[0][1] === firstRing[firstRing.length - 1][1]
          ? firstRing
          : [...firstRing, firstRing[0]];
      const coordText = closedRing
        .map(([lon, lat]: [number, number]) => `${ensureSixDecimals(lon)} ${ensureSixDecimals(lat)}`)
        .join(', ');
      const polygonWkt = `POLYGON((${coordText}))`;
      geometrySql = `ST_SetSRID(ST_GeomFromText('${polygonWkt}'), 4326)`;
      kind = 'polygon';
      const farmerId = (await this.getPlotTenantScope(plotId)).farmerId;
      await this.runPolygonGeometryQualityGate({
        geometrySql,
        farmerId,
        excludePlotId: plotId,
        userId,
        tenantId,
        audit: { phase: 'geometry_update', plotId, reason: dto.reason },
      });
    } else {
      throw new BadRequestException('Unsupported geometry type');
    }

    const updateRes = await this.pool.query(
      `
      WITH input_geom AS (
        SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
      ),
      normalized AS (
        SELECT
          CASE
            WHEN $8::text = 'polygon' THEN ST_CollectionExtract(ST_MakeValid(geom), 3)
            ELSE geom
          END AS geom,
          CASE
            WHEN $8::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS original_area_ha
        FROM input_geom
      ),
      validated AS (
        SELECT
          geom,
          original_area_ha,
          CASE
            WHEN $8::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS normalized_area_ha,
          CASE
            WHEN $8::text = 'polygon' AND original_area_ha > 0
              THEN ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / original_area_ha * 100.0
            ELSE NULL
          END AS correction_variance_pct
        FROM normalized
      ),
      upd AS (
        UPDATE plot p
        SET
          geometry = v.geom,
          centroid = ST_Centroid(v.geom),
          kind = $2,
          area_ha = ST_Area(v.geom::geography) / 10000.0,
          declared_area_ha = $3,
          precision_m_at_capture = $4,
          hdop_at_capture = $5,
          updated_at = NOW()
        FROM validated v
        WHERE p.id = $1
          AND (
            $8::text <> 'polygon'
            OR v.geom IS NOT NULL
          ) AND (
            $8::text <> 'polygon'
            OR v.correction_variance_pct IS NULL
            OR v.correction_variance_pct <= 5
          )
        RETURNING p.*, ST_AsGeoJSON(p.geometry) AS geometry_geojson
      )
      SELECT
        u.*,
        v.original_area_ha,
        v.normalized_area_ha,
        v.correction_variance_pct
      FROM upd u
      CROSS JOIN validated v
      `,
      [
        plotId,
        kind,
        dto.declaredAreaHa ?? null,
        dto.precisionMeters ?? null,
        dto.hdop ?? null,
        dto.reason,
        dto.deviceId ?? null,
        kind,
      ],
    );

    if (updateRes.rowCount === 0 && kind === 'polygon') {
      const varianceProbe = await this.pool.query(
        `
          WITH input_geom AS (
            SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
          ),
          normalized AS (
            SELECT
              ST_CollectionExtract(ST_MakeValid(geom), 3) AS geom,
              ST_Area(geom::geography) / 10000.0 AS original_area_ha
            FROM input_geom
          )
          SELECT
            CASE
              WHEN geom IS NULL THEN NULL
              ELSE ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / NULLIF(original_area_ha, 0) * 100.0
            END AS correction_variance_pct
          FROM normalized
        `,
      );
      const variance = Number(varianceProbe.rows?.[0]?.correction_variance_pct);
      if (Number.isFinite(variance) && variance > 5) {
        throw new BadRequestException(
          `GEO-102: Geometry correction variance ${variance.toFixed(2)}% exceeds 5% tolerance.`,
        );
      }
      throw new BadRequestException(
        'GEO-101: Invalid polygon geometry could not be normalized with ST_MakeValid.',
      );
    }

    const row = updateRes.rows[0];
    if (dto.declaredAreaHa != null && row?.area_ha != null) {
      const areaHa = Number(row.area_ha);
      const diffPct = (Math.abs(areaHa - dto.declaredAreaHa) / dto.declaredAreaHa) * 100;
      if (diffPct > 5) {
        throw new BadRequestException(
          `Area discrepancy ${diffPct.toFixed(1)}% exceeds 5% tolerance.`,
        );
      }
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, device_id, event_type, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        userId ?? null,
        dto.deviceId ?? null,
        'plot_geometry_superseded',
        JSON.stringify({
          plotId,
          reason: dto.reason,
          reviewerAssist: dto.reviewerAssist === true,
          previous: {
            kind: existingRes.rows[0].kind ?? null,
            geometry: existingRes.rows[0].geometry_geojson ?? null,
          },
          next: {
            kind: row.kind ?? null,
            geometry: row.geometry_geojson ?? null,
          },
          geometryNormalization:
            kind === 'polygon'
              ? {
                  originalAreaHa: row.original_area_ha ?? null,
                  normalizedAreaHa: row.normalized_area_ha ?? null,
                  correctionVariancePct: row.correction_variance_pct ?? null,
                }
              : null,
        }),
      ],
    );

    return {
      id: row.id,
      kind: row.kind,
      areaHa: row.area_ha,
      declaredAreaHa: row.declared_area_ha,
      geometryGeoJson: row.geometry_geojson,
    };
  }
}

