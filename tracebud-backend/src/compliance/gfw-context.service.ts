import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GfwService } from './gfw.service';
import {
  emptyGfwContextSummary,
  type GfwContextLayerResult,
  type GfwContextScreening,
  type GfwContextSummary,
  gfwContextToSignal,
} from './gfw-context-fusion';

type ContextLayerConfig = {
  key: keyof GfwContextSummary;
  dataset: string;
  version: string;
  sql: string;
  fieldMap: Record<string, keyof GfwContextSummary>;
};

@Injectable()
export class GfwContextService {
  constructor(
    private readonly config: ConfigService,
    private readonly gfw: GfwService,
  ) {}

  enabled(): boolean {
    return (this.config.get<string>('GFW_CONTEXT_ENABLED') ?? 'true').toLowerCase() !== 'false';
  }

  private resolveSqlTemplate(template: string, tokens: Record<string, string>): string {
    return Object.entries(tokens).reduce(
      (sql, [token, value]) => sql.split(`{{${token}}}`).join(value),
      template,
    );
  }

  private cutoffYear(cutoffDate: string): string {
    const year = new Date(`${cutoffDate}T00:00:00.000Z`).getUTCFullYear();
    return Number.isFinite(year) ? String(year) : '2020';
  }

  private layerConfigs(cutoffDate: string): ContextLayerConfig[] {
    const cutoffYear = this.cutoffYear(cutoffDate);
    const version = this.config.get<string>('GFW_CONTEXT_VERSION') ?? 'latest';

    return [
      {
        key: 'tropicalTreeCoverAvgPct',
        dataset:
          this.config.get<string>('GFW_CONTEXT_TROPICAL_TREE_COVER_DATASET') ?? 'wri_tropical_tree_cover',
        version,
        sql:
          this.config.get<string>('GFW_CONTEXT_TROPICAL_TREE_COVER_SQL') ??
          'SELECT AVG(wri_tropical_tree_cover__percent) AS avg_pct, SUM(area__ha) AS area_ha FROM data',
        fieldMap: {
          avg_pct: 'tropicalTreeCoverAvgPct',
          area_ha: 'tropicalTreeCoverAreaHa',
        },
      },
      {
        key: 'treeCoverLossHa',
        dataset: this.config.get<string>('GFW_CONTEXT_TREE_COVER_LOSS_DATASET') ?? 'umd_tree_cover_loss',
        version,
        sql: this.resolveSqlTemplate(
          this.config.get<string>('GFW_CONTEXT_TREE_COVER_LOSS_SQL_TEMPLATE') ??
            'SELECT SUM(area__ha) AS loss_ha FROM data WHERE umd_tree_cover_loss__year > {{cutoffYear}}',
          { cutoffYear },
        ),
        fieldMap: {
          loss_ha: 'treeCoverLossHa',
        },
      },
      {
        key: 'naturalForestHa',
        dataset:
          this.config.get<string>('GFW_CONTEXT_NATURAL_FOREST_DATASET') ?? 'sbtn_natural_forests_map',
        version,
        sql:
          this.config.get<string>('GFW_CONTEXT_NATURAL_FOREST_SQL') ??
          'SELECT SUM(area__ha) AS natural_ha FROM data',
        fieldMap: {
          natural_ha: 'naturalForestHa',
        },
      },
    ];
  }

  private normalizeNumeric(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private extractRowValues(
    result: unknown,
    fieldMap: Record<string, keyof GfwContextSummary>,
  ): Record<string, number | null> {
    const container = (result as { data?: unknown })?.data ?? result;
    const first = Array.isArray(container) ? container[0] : null;
    if (!first || typeof first !== 'object') {
      return {};
    }
    const row = first as Record<string, unknown>;
    const values: Record<string, number | null> = {};
    for (const [sourceField, targetField] of Object.entries(fieldMap)) {
      values[targetField] = this.normalizeNumeric(row[sourceField]);
    }
    return values;
  }

  private mergeSummary(
    summary: GfwContextSummary,
    values: Record<string, number | null>,
  ): GfwContextSummary {
    return {
      tropicalTreeCoverAvgPct: values.tropicalTreeCoverAvgPct ?? summary.tropicalTreeCoverAvgPct,
      tropicalTreeCoverAreaHa: values.tropicalTreeCoverAreaHa ?? summary.tropicalTreeCoverAreaHa,
      treeCoverLossHa: values.treeCoverLossHa ?? summary.treeCoverLossHa,
      naturalForestHa: values.naturalForestHa ?? summary.naturalForestHa,
    };
  }

  private async queryLayer(
    geometry: unknown,
    layer: ContextLayerConfig,
  ): Promise<GfwContextLayerResult> {
    try {
      const response = await this.gfw.runDatasetQuery({
        dataset: layer.dataset,
        version: layer.version,
        geometry,
        sql: layer.sql,
      });
      const values = this.extractRowValues(response.result, layer.fieldMap);
      return {
        dataset: layer.dataset,
        version: response.version,
        sql: layer.sql,
        ok: true,
        values,
      };
    } catch (error) {
      return {
        dataset: layer.dataset,
        version: layer.version,
        sql: layer.sql,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        values: {},
      };
    }
  }

  async queryForGeometry(geometry: unknown, cutoffDate: string): Promise<GfwContextScreening> {
    if (!this.enabled()) {
      return {
        summary: emptyGfwContextSummary(),
        signal: 'unknown',
        layers: [],
        queriedAt: new Date().toISOString(),
      };
    }

    const layers = await Promise.all(
      this.layerConfigs(cutoffDate).map((layer) => this.queryLayer(geometry, layer)),
    );

    let summary = emptyGfwContextSummary();
    for (const layer of layers) {
      summary = this.mergeSummary(summary, layer.values);
    }

    const signal = gfwContextToSignal(summary);

    return {
      summary,
      signal,
      layers,
      queriedAt: new Date().toISOString(),
    };
  }
}
