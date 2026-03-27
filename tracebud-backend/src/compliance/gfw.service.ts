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
    // User can override with a specific dataset slug.
    return this.config.get<string>('GFW_DATASET') ?? 'umd_glad_s2_alerts';
  }

  private raddDataset() {
    return this.config.get<string>('GFW_RADD_DATASET') ?? 'radd_alerts';
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

  async runRaddFallback(params: { geometry: any; sql?: string }) {
    const dataset = this.raddDataset();
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
        `GFW RADD query failed (${res.status}). ${
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
      sql: params.sql ?? this.sql(),
      result: bodyJson,
    };
  }
}

