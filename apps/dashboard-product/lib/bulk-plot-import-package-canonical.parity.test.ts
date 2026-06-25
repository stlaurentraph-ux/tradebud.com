import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalizeTracebudImportV1ForHash,
  getTracebudImportV1CanonicalMessage,
} from '@tracebud/import-v1-canonical';
import { computeTracebudImportV1ContentHash } from '@/lib/bulk-plot-import-package';

const fixtureRoot = join(process.cwd(), '../../product-os/04-quality/fixtures');

describe('tracebud import v1 canonical parity', () => {
  it('matches the shared golden canonical message and hash', async () => {
    const fixture = JSON.parse(
      readFileSync(join(fixtureRoot, 'tracebud-import-v1-canonical.fixture.json'), 'utf8'),
    );
    const golden = JSON.parse(
      readFileSync(join(fixtureRoot, 'tracebud-import-v1-canonical.golden.json'), 'utf8'),
    );

    expect(getTracebudImportV1CanonicalMessage(fixture)).toBe(golden.canonicalMessage);
    expect(JSON.stringify(canonicalizeTracebudImportV1ForHash(fixture))).toBe(golden.canonicalMessage);
    await expect(computeTracebudImportV1ContentHash(fixture)).resolves.toBe(golden.contentHashSha256);
  });
});
