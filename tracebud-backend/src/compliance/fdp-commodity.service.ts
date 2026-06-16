import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  assessFdpTemporalStability,
  emptyFdpCommoditySummary,
  fdpCommodityToSignal,
  FDP_BASELINE_YEAR,
  FDP_TEMPORAL_YEARS,
  type FdpCommodityScreening,
  type FdpCommoditySummary,
  type FdpYearStats,
} from './fdp-commodity-fusion';
import {
  canonicalizeFdpCommodity,
  FDP_PILOT_COMMODITY,
  isFdpPilotCommodity,
  resolveFdpCoffeeProfile,
  type FdpCountryCoffeeProfile,
} from './fdp-commodity-profiles';

type WorkerYearStats = {
  mean?: number | null;
  p50?: number | null;
  p90?: number | null;
};

type WorkerScreenResponse = {
  ok?: boolean;
  modelVersion?: string;
  commodity?: string;
  countryCode?: string | null;
  countryLabel?: string | null;
  years?: Record<string, WorkerYearStats>;
  competingCommodity?: string | null;
  competingProbMean?: number | null;
  layers?: Array<{
    commodity?: string;
    year?: number;
    dataset?: string;
    ok?: boolean;
    error?: string;
  }>;
  queriedAt?: string;
  error?: string;
};

@Injectable()
export class FdpCommodityService {
  constructor(private readonly config: ConfigService) {}

  enabled(): boolean {
    return (this.config.get<string>('FDP_ENABLED') ?? 'false').toLowerCase() === 'true';
  }

  private workerUrl(): string | null {
    const url = this.config.get<string>('FDP_SCREENING_WORKER_URL')?.trim();
    return url || null;
  }

  private workerTimeoutMs(): number {
    const raw = Number(this.config.get<string>('FDP_SCREENING_TIMEOUT_MS') ?? '30000');
    return Number.isFinite(raw) && raw > 0 ? raw : 30000;
  }

  private defaultCommodity(): string {
    return canonicalizeFdpCommodity(this.config.get<string>('FDP_DECLARED_COMMODITY')) ?? FDP_PILOT_COMMODITY;
  }

  shouldScreen(params: {
    countryCode: string | null | undefined;
    commodity: string | null | undefined;
  }): { eligible: boolean; profile: FdpCountryCoffeeProfile | null; commodity: string | null; reason?: string } {
    if (!this.enabled()) {
      return { eligible: false, profile: null, commodity: null, reason: 'fdp_disabled' };
    }
    if (!this.workerUrl()) {
      return { eligible: false, profile: null, commodity: null, reason: 'worker_url_missing' };
    }

    const commodity = canonicalizeFdpCommodity(params.commodity ?? this.defaultCommodity());
    if (!isFdpPilotCommodity(commodity)) {
      return { eligible: false, profile: null, commodity, reason: 'commodity_not_in_pilot' };
    }

    const profile = resolveFdpCoffeeProfile(params.countryCode);
    if (!profile) {
      return { eligible: false, profile: null, commodity, reason: 'country_not_in_pilot' };
    }

    return { eligible: true, profile, commodity };
  }

  private normalizeYearStats(value: WorkerYearStats | undefined): FdpYearStats {
    const normalize = (input: unknown): number | null => {
      if (typeof input === 'number' && Number.isFinite(input)) return input;
      if (typeof input === 'string' && input.trim() !== '') {
        const parsed = Number(input);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    return {
      mean: normalize(value?.mean),
      p50: normalize(value?.p50),
      p90: normalize(value?.p90),
    };
  }

  private buildSummaryFromWorker(
    body: WorkerScreenResponse,
    profile: FdpCountryCoffeeProfile,
    commodity: string,
  ): FdpCommoditySummary {
    const years: Record<string, FdpYearStats> = {};
    for (const year of FDP_TEMPORAL_YEARS) {
      years[String(year)] = this.normalizeYearStats(body.years?.[String(year)]);
    }

    const summary: FdpCommoditySummary = {
      ok: body.ok === true,
      modelVersion: '2025b',
      commodity,
      countryCode: profile.countryCode,
      countryLabel: body.countryLabel ?? profile.label,
      baselineYear: FDP_BASELINE_YEAR,
      years,
      competingCommodity:
        typeof body.competingCommodity === 'string' ? body.competingCommodity : null,
      competingProbMean:
        typeof body.competingProbMean === 'number' && Number.isFinite(body.competingProbMean)
          ? body.competingProbMean
          : null,
      temporalStability: 'unknown',
      layers: Array.isArray(body.layers)
        ? body.layers.map((layer) => ({
            commodity: typeof layer.commodity === 'string' ? layer.commodity : commodity,
            year: typeof layer.year === 'number' ? layer.year : FDP_BASELINE_YEAR,
            dataset:
              typeof layer.dataset === 'string'
                ? layer.dataset
                : `projects/forestdatapartnership/assets/${commodity}/model_2025b`,
            ok: layer.ok === true,
            error: typeof layer.error === 'string' ? layer.error : undefined,
          }))
        : [],
      queriedAt: typeof body.queriedAt === 'string' ? body.queriedAt : new Date().toISOString(),
    };

    summary.temporalStability = assessFdpTemporalStability(summary, profile.thresholds);
    return summary;
  }

  async queryForGeometry(params: {
    geometry: unknown;
    countryCode: string | null | undefined;
    commodity?: string | null;
  }): Promise<FdpCommodityScreening> {
    const gate = this.shouldScreen({
      countryCode: params.countryCode,
      commodity: params.commodity,
    });

    if (!gate.eligible || !gate.profile || !gate.commodity) {
      const summary = emptyFdpCommoditySummary({
        commodity: gate.commodity ?? this.defaultCommodity(),
        countryCode: params.countryCode ?? null,
        skippedReason: gate.reason,
      });
      return { summary, signal: 'unknown' };
    }

    const workerUrl = this.workerUrl();
    if (!workerUrl) {
      const summary = emptyFdpCommoditySummary({
        commodity: gate.commodity,
        countryCode: gate.profile.countryCode,
        skippedReason: 'worker_url_missing',
      });
      return { summary, signal: 'unknown' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.workerTimeoutMs());

    try {
      const res = await fetch(`${workerUrl.replace(/\/+$/, '')}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: params.geometry,
          commodity: gate.commodity,
          countryCode: gate.profile.countryCode,
          years: [...FDP_TEMPORAL_YEARS],
          modelVersion: '2025b',
        }),
        signal: controller.signal,
      });

      const bodyText = await res.text().catch(() => '');
      let body: WorkerScreenResponse = {};
      try {
        body = bodyText ? (JSON.parse(bodyText) as WorkerScreenResponse) : {};
      } catch {
        body = { ok: false, error: bodyText.slice(0, 500) };
      }

      if (!res.ok) {
        const summary = emptyFdpCommoditySummary({
          commodity: gate.commodity,
          countryCode: gate.profile.countryCode,
          skippedReason: `worker_http_${res.status}`,
        });
        summary.layers.push({
          commodity: gate.commodity,
          year: FDP_BASELINE_YEAR,
          dataset: `projects/forestdatapartnership/assets/${gate.commodity}/model_2025b`,
          ok: false,
          error: typeof body.error === 'string' ? body.error : `HTTP ${res.status}`,
        });
        return { summary, signal: 'unknown' };
      }

      const summary = this.buildSummaryFromWorker(body, gate.profile, gate.commodity);
      const signal = fdpCommodityToSignal(summary, gate.profile.thresholds);
      return { summary, signal };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const summary = emptyFdpCommoditySummary({
        commodity: gate.commodity,
        countryCode: gate.profile.countryCode,
        skippedReason: 'worker_request_failed',
      });
      summary.layers.push({
        commodity: gate.commodity,
        year: FDP_BASELINE_YEAR,
        dataset: `projects/forestdatapartnership/assets/${gate.commodity}/model_2025b`,
        ok: false,
        error: message,
      });
      return { summary, signal: 'unknown' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
