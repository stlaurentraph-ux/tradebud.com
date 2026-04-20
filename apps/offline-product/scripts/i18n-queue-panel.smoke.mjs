import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const languageContextPath = resolve(process.cwd(), 'features/state/LanguageContext.tsx');
const QUEUE_I18N_SMOKE_VERSION = '1';

const REQUIRED_QUEUE_KEYS = [
  'sync_queue_preferences_reset',
  'sync_queue_no_action_selected',
  'sync_queue_smart_pass_retrying',
  'sync_queue_smart_pass_first',
  'sync_queue_smart_cap_reached',
  'sync_queue_filter_none',
  'sync_queue_filter_summary',
  'sync_queue_filter_harvest',
  'sync_queue_filter_photos',
  'sync_queue_filter_evidence',
  'sync_queue_attempt_scope_smart',
  'sync_queue_attempt_scope_retrying',
  'sync_queue_attempt_scope_first',
  'sync_queue_attempt_scope_all',
  'sync_queue_health_summary',
  'sync_queue_smart_sweep_label',
  'sync_queue_reset_preferences_label',
  'sync_queue_attempt_chip_all',
  'sync_queue_attempt_chip_retrying',
  'sync_queue_attempt_chip_first',
];

function extractLocaleBlock(source, locale) {
  const marker = `${locale}: {`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Locale block not found: ${locale}`);
  }
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      return source.slice(bodyStart + 1, i);
    }
  }
  throw new Error(`Locale block parse failed: ${locale}`);
}

function extractKeys(localeBlock) {
  const keys = new Set();
  const re = /^\s*([a-z0-9_]+):/gim;
  let match = re.exec(localeBlock);
  while (match) {
    keys.add(match[1]);
    match = re.exec(localeBlock);
  }
  return keys;
}

async function main() {
  const cliArgs = new Set(process.argv.slice(2));
  const source = await readFile(languageContextPath, 'utf8');
  const enKeys = extractKeys(extractLocaleBlock(source, 'en'));
  const esKeys = extractKeys(extractLocaleBlock(source, 'es'));

  const missingInEn = REQUIRED_QUEUE_KEYS.filter((k) => !enKeys.has(k));
  const missingInEs = REQUIRED_QUEUE_KEYS.filter((k) => !esKeys.has(k));

  if (missingInEn.length > 0 || missingInEs.length > 0) {
    const chunks = [];
    if (missingInEn.length > 0) {
      chunks.push(`missing in en: ${missingInEn.join(', ')}`);
    }
    if (missingInEs.length > 0) {
      chunks.push(`missing in es: ${missingInEs.join(', ')}`);
    }
    throw new Error(`Queue panel i18n smoke failed - ${chunks.join(' | ')}`);
  }

  if (cliArgs.has('--summary-json')) {
    process.stdout.write(
      `${JSON.stringify(
        {
          status: 'PASS',
          smokeVersion: QUEUE_I18N_SMOKE_VERSION,
          requiredKeyCount: REQUIRED_QUEUE_KEYS.length,
          locales: ['en', 'es'],
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(
    `PASS queue panel i18n smoke (v${QUEUE_I18N_SMOKE_VERSION}, ${REQUIRED_QUEUE_KEYS.length} keys validated in en/es)\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`FAIL queue panel i18n smoke: ${error.message}\n`);
  process.exitCode = 1;
});
