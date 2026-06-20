#!/usr/bin/env node
/**
 * Validates env + DB + optional AI Gateway smoke for tenure document parsing.
 * Usage: npm run check:tenure-parse
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (value) out[key] = value;
  }
  return out;
}

function loadEnv() {
  const merged = {
    ...loadEnvFile(resolve(process.cwd(), '.env')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
    ...process.env,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'string' && value.trim()) process.env[key] = value.trim();
  }
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

async function smokeGateway() {
  const apiKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey) return { skipped: true, reason: 'No AI_GATEWAY_API_KEY' };

  const baseUrl =
    process.env.AI_GATEWAY_URL?.trim() || 'https://ai-gateway.vercel.sh/v1/chat/completions';
  const model = process.env.AI_TENURE_PARSE_MODEL?.trim() || 'google/gemini-2.5-flash';
  const zdr = process.env.AI_TENURE_PARSE_ZDR?.trim() !== 'false';

  const normalizedModel = model.includes('/') ? model : `google/${model}`;
  const isGemini =
    normalizedModel.toLowerCase().startsWith('google/') ||
    normalizedModel.toLowerCase().startsWith('gemini-');
  const body = {
    model: normalizedModel,
    temperature: 0,
    max_tokens: 32,
    store: false,
    messages: [
      {
        role: 'user',
        content: isGemini
          ? 'Return JSON only with no markdown: {"ok":true}'
          : 'Reply with JSON: {"ok":true}',
      },
    ],
    providerOptions: {
      gateway: {
        ...(zdr ? { zeroDataRetention: true } : {}),
        disallowPromptTraining: true,
        tags: ['tenure-parse-smoke'],
      },
    },
  };
  if (!isGemini) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      skipped: false,
      ok: false,
      status: res.status,
      detail: text.slice(0, 280),
    };
  }
  return { skipped: false, ok: true, status: res.status, detail: 'Gateway accepted smoke request' };
}

async function main() {
  loadEnv();
  const runSmoke = process.argv.includes('--smoke');

  const checks = [];
  checks.push(
    check(
      'AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN',
      Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()),
      'Required for Gemini via Vercel AI Gateway',
    ),
  );
  checks.push(
    check(
      'SUPABASE_SERVICE_ROLE_KEY',
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      'Required to download tenure files from plot-evidence',
    ),
  );
  checks.push(check('SUPABASE_URL', Boolean(process.env.SUPABASE_URL?.trim()), ''));
  checks.push(
    check(
      'EVIDENCE_STORAGE_BUCKET',
      Boolean((process.env.EVIDENCE_STORAGE_BUCKET || 'plot-evidence').trim()),
      process.env.EVIDENCE_STORAGE_BUCKET || 'plot-evidence (default)',
    ),
  );
  checks.push(check('DATABASE_URL', Boolean(process.env.DATABASE_URL?.trim()), ''));

  const model = process.env.AI_TENURE_PARSE_MODEL?.trim() || 'google/gemini-2.5-flash';
  const zdr = process.env.AI_TENURE_PARSE_ZDR?.trim() !== 'false';
  checks.push(check('AI_TENURE_PARSE_MODEL', true, model));
  checks.push(
    check('AI_TENURE_PARSE_ZDR', true, zdr ? 'enabled (needs Vercel Pro/Enterprise)' : 'disabled'),
  );

  if (process.env.DATABASE_URL?.trim()) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const res = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'plot_tenure_verification'
        ) AS ok
      `);
      checks.push(
        check(
          'plot_tenure_verification table',
          res.rows[0]?.ok === true,
          'Run npm run db:apply:tenure-verification if missing',
        ),
      );
      const cadastralSql = await client.query(`
        SELECT COALESCE(ua.name, LEFT(fp.id::text, 8)) AS farmer_name
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        LIMIT 1
      `);
      checks.push(
        check(
          'cadastral context SQL',
          true,
          cadastralSql.rows.length > 0
            ? `sample farmer_name=${cadastralSql.rows[0]?.farmer_name ?? '(null)'}`
            : 'no plots yet (query ok)',
        ),
      );
    } catch (error) {
      checks.push(
        check(
          'plot_tenure_verification table',
          false,
          error instanceof Error ? error.message : String(error),
        ),
      );
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  console.log('Tenure parse readiness\n');
  let allOk = true;
  for (const row of checks) {
    const mark = row.ok ? 'OK' : 'MISSING';
    if (!row.ok) allOk = false;
    console.log(`[${mark}] ${row.name}${row.detail ? ` — ${row.detail}` : ''}`);
  }

  if (runSmoke) {
    console.log('\nGateway smoke test…');
    const smoke = await smokeGateway();
    if (smoke.skipped) {
      console.log(`[SKIP] ${smoke.reason}`);
    } else if (smoke.ok) {
      console.log(`[OK] AI Gateway (${smoke.status}) — ${smoke.detail}`);
    } else {
      allOk = false;
      console.log(`[FAIL] AI Gateway (${smoke.status}) — ${smoke.detail}`);
      if (smoke.detail?.includes('no_providers_available') && zdr) {
        console.log(
          'Hint: per-request ZDR needs Vercel Pro/Enterprise. On Hobby, set AI_TENURE_PARSE_ZDR=false.',
        );
      }
    }
  } else {
    console.log('\nRun with --smoke to ping AI Gateway (costs a few tokens).');
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
