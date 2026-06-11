import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GfwService {
  constructor(private readonly config: ConfigService) {}

  private baseUrl() {
    return this.config.get<string>('GFW_BASE_URL') ?? 'https://data-api.globalforestwatch.org';
  }

  private apiKey() {
    return this.config.get<string>('GFW_API_KEY') ?? null;
  }

  private dataset() {
    // `umd_glad_s2_alerts` / `radd_alerts` slugs are retired on the public GFW Data API.
    return this.config.get<string>('GFW_DATASET') ?? 'gfw_integrated_alerts';
  }

  private raddDataset() {
    return this.config.get<string>('GFW_RADD_DATASET') ?? 'umd_glad_dist_alerts';
  }

  private version() {
    return this.config.get<string>('GFW_VERSION') ?? 'latest';
  }

  private sql() {
    // Kept configurable because field names differ per dataset.
    return (
      this.config.get<string>('GFW_SQL') ??
      'SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data'
    );
  }

  private deforestationSqlTemplate() {
    return (
      this.config.get<string>('GFW_DEFORESTATION_SQL_TEMPLATE') ??
      "SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data WHERE gfw_integrated_alerts__date > '{{cutoffDate}}'"
    );
  }

  private fallbackDeforestationSqlTemplate() {
    return (
      this.config.get<string>('GFW_FALLBACK_DEFORESTATION_SQL_TEMPLATE') ??
      "SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data WHERE umd_glad_landsat_alerts__date > '{{cutoffDate}}'"
    );
  }

  private resolveSqlTemplate(template: string, cutoffDate: string) {
    return template.includes('{{cutoffDate}}')
      ? template.split('{{cutoffDate}}').join(cutoffDate)
      : template;
  }

  async runGeometryQuery(params: { geometry: any; sql?: string }) {
    const dataset = this.dataset();
    const version = this.version();
    const url = `${this.baseUrl()}/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(
      version,
    )}/query/json`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = this.apiKey();
    if (key) {
      headers['x-api-key'] = key;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        geometry: params.geometry,
        sql: params.sql ?? this.sql(),
      }),
    });

    const bodyText = await res.text().catch(() => '');
    let bodyJson: any = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = bodyText;
    }

    if (!res.ok) {
      throw new Error(
        `GFW query failed (${res.status}). ${
          typeof bodyJson === 'string' ? bodyJson : JSON.stringify(bodyJson)
        }`,
      );
    }

    if (typeof bodyJson === 'string') {
      // Some endpoints may return a JSON string; try to parse it.
      try {
        bodyJson = JSON.parse(bodyJson);
      } catch {
        // keep string
      }
    }

    return {
      dataset,
      version,
      sql: params.sql ?? this.sql(),
      result: bodyJson,
    };
  }

  async runRaddFallback(params: { geometry: any; sql?: string; cutoffDate?: string }) {
    const dataset = this.raddDataset();
    const version = this.version();
    const sql =
      params.sql ??
      (params.cutoffDate
        ? this.resolveSqlTemplate(this.fallbackDeforestationSqlTemplate(), params.cutoffDate)
        : this.sql());
    const url = `${this.baseUrl()}/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(
      version,
    )}/query/json`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = this.apiKey();
    if (key) {
      headers['x-api-key'] = key;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        geometry: params.geometry,
        sql,
      }),
    });

    const bodyText = await res.text().catch(() => '');
    let bodyJson: any = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = bodyText;
    }

    if (!res.ok) {
      throw new Error(
        `GFW fallback query failed (${res.status}). ${
          typeof bodyJson === 'string' ? bodyJson : JSON.stringify(bodyJson)
        }`,
      );
    }

    if (typeof bodyJson === 'string') {
      try {
        bodyJson = JSON.parse(bodyJson);
      } catch {
        // keep string
      }
    }

    return {
      dataset,
      version,
      sql,
      result: bodyJson,
      historicalSqlApplied: Boolean(params.cutoffDate),
      cutoffDate: params.cutoffDate ?? null,
    };
  }

  async runHistoricalDeforestationQuery(params: { geometry: any; cutoffDate: string }) {
    const resolvedSql = this.resolveSqlTemplate(this.deforestationSqlTemplate(), params.cutoffDate);

    const response = await this.runGeometryQuery({
      geometry: params.geometry,
      sql: resolvedSql,
    });

    return {
      ...response,
      historicalSqlApplied: resolvedSql !== this.sql(),
      cutoffDate: params.cutoffDate,
    };
  }

  async runDatasetQuery(params: {
    dataset: string;
    version?: string;
    geometry: any;
    sql: string;
  }) {
    const dataset = params.dataset;
    const version = params.version ?? this.version();
    const url = `${this.baseUrl()}/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(
      version,
    )}/query/json`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = this.apiKey();
    if (key) {
      headers['x-api-key'] = key;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        geometry: params.geometry,
        sql: params.sql,
      }),
    });

    const bodyText = await res.text().catch(() => '');
    let bodyJson: any = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = bodyText;
    }

    if (!res.ok) {
      throw new Error(
        `GFW dataset query failed (${res.status}). ${
          typeof bodyJson === 'string' ? bodyJson : JSON.stringify(bodyJson)
        }`,
      );
    }

    if (typeof bodyJson === 'string') {
      try {
        bodyJson = JSON.parse(bodyJson);
      } catch {
        // keep string
      }
    }

    return {
      dataset,
      version,
      sql: params.sql,
      result: bodyJson,
    };
  }
}

