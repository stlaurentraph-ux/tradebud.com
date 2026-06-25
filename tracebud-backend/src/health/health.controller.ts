import { Controller, Get } from '@nestjs/common';
import {
  collectDatabaseUrlWarnings,
  isSupabasePoolerUrl,
  resolvePgPoolMax,
} from '../db/pg-pool-config';
import { PROD_PROJECT_REF, getSupabaseProjectRef } from '../db/supabase-db-refs';
import { getRateLimit429Snapshot } from '../http/rate-limit-observability';

@Controller()
export class HealthController {
  private readonly defaultBenchmarkAdminClaims = ['ADMIN', 'COMPLIANCE_MANAGER'];

  private getConfiguredBenchmarkAdminClaims() {
    const raw = process.env.BENCHMARK_ADMIN_ROLE_CLAIMS?.trim();
    if (!raw) {
      return this.defaultBenchmarkAdminClaims;
    }
    return raw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0);
  }

  @Get('health')
  getHealth() {
    const requiredClaims = this.getConfiguredBenchmarkAdminClaims();
    const warnings: string[] = [];

    if (requiredClaims.length === 0) {
      warnings.push('Benchmark-admin claim configuration is empty; benchmark admin routes may be inaccessible.');
    }

    if (!process.env.GFW_API_KEY?.trim()) {
      warnings.push(
        'GFW_API_KEY is not configured; plot deforestation screening will stay pending_check until set.',
      );
    }

    const tenureParse = this.getTenureParseReadiness();
    warnings.push(...tenureParse.warnings);

    const pushNotifications = this.getPushNotificationReadiness();
    warnings.push(...pushNotifications.warnings);

    const database = this.getDatabaseReadiness();
    warnings.push(...database.warnings);

    return {
      status: 'ok',
      warnings,
      rateLimit429: getRateLimit429Snapshot(),
      benchmarkAdminAuth: {
        claimEnforced: true,
        configured: requiredClaims.length > 0,
        requiredClaims,
      },
      tenureParse,
      pushNotifications,
      database,
    };
  }

  private getDatabaseReadiness() {
    const connectionString = process.env.DATABASE_URL?.trim() ?? '';
    const warnings = collectDatabaseUrlWarnings(connectionString);
    const projectRef = connectionString ? getSupabaseProjectRef(connectionString) : null;
    const matchesProdProject = projectRef === PROD_PROJECT_REF;
    if (connectionString && projectRef && !matchesProdProject) {
      warnings.push(
        `DATABASE_URL project ref ${projectRef} does not match Tracebud prod (${PROD_PROJECT_REF}).`,
      );
    }
    return {
      poolMaxPerReplica: resolvePgPoolMax(),
      usesSupabasePooler: connectionString ? isSupabasePoolerUrl(connectionString) : false,
      applicationName: process.env.PG_APPLICATION_NAME?.trim() || 'tracebud_api',
      projectRef,
      expectedProdProjectRef: PROD_PROJECT_REF,
      matchesProdProject,
      warnings,
    };
  }

  private getPushNotificationReadiness() {
    const warnings: string[] = [];
    const expoAccessTokenConfigured = Boolean(process.env.EXPO_ACCESS_TOKEN?.trim());
    if (!expoAccessTokenConfigured) {
      warnings.push(
        'EXPO_ACCESS_TOKEN is not configured; Expo push still works with low rate limits but may drop alerts in production.',
      );
    }
    return {
      ready: true,
      expoAccessTokenConfigured,
      pushDevicesTableReady: true,
      supportedRoles: ['farmer', 'agent', 'cooperative', 'exporter', 'compliance_manager'],
      warnings,
    };
  }

  private getTenureParseReadiness() {
    const warnings: string[] = [];
    const gatewayKey =
      process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || '';
    const openaiKey = process.env.OPENAI_API_KEY?.trim() || '';
    const llmConfigured = Boolean(gatewayKey || openaiKey);
    const viaGateway = Boolean(gatewayKey);
    const zdrEnabled = process.env.AI_TENURE_PARSE_ZDR?.trim() !== 'false';
    const model = process.env.AI_TENURE_PARSE_MODEL?.trim() || (viaGateway ? 'google/gemini-2.5-flash' : 'gpt-4o-mini');
    const storageBucket = process.env.EVIDENCE_STORAGE_BUCKET?.trim() || 'plot-evidence';

    if (!llmConfigured) {
      warnings.push(
        'Tenure AI parse: set AI_GATEWAY_API_KEY (recommended) or OPENAI_API_KEY for automated tenure extraction.',
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      warnings.push(
        'Tenure AI parse: SUPABASE_SERVICE_ROLE_KEY is required to download tenure evidence from storage.',
      );
    }
    if (!viaGateway && openaiKey) {
      warnings.push(
        'Tenure AI parse: using direct OPENAI_API_KEY — prefer AI Gateway with zeroDataRetention for sensitive tenure documents.',
      );
    }
    if (viaGateway && !zdrEnabled) {
      warnings.push(
        'Tenure AI parse: AI_TENURE_PARSE_ZDR=false — enable team-wide ZDR in Vercel AI Gateway settings for defense in depth.',
      );
    }

    return {
      ready: llmConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      llmConfigured,
      viaGateway,
      zeroDataRetention: viaGateway ? zdrEnabled : false,
      disallowPromptTraining: viaGateway,
      model,
      storageBucket,
      gatewayUrl:
        process.env.AI_GATEWAY_URL?.trim() || 'https://ai-gateway.vercel.sh/v1/chat/completions',
      zdrRequiresVercelPlan: 'Pro or Enterprise (per-request ZDR is free on those plans)',
      warnings,
    };
  }
}

