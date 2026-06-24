import { readFileSync } from 'fs';
import { join } from 'path';
import {
  assertTracebudImportV1PackageShape,
  computeTracebudImportV1ContentHash,
  getTracebudImportV1CanonicalMessage,
} from './bulk-plot-import-package.util';

const fixtureRoot = join(__dirname, '../../../product-os/04-quality/fixtures');

describe('tracebud import v1 canonical parity', () => {
  it('matches the shared golden canonical message and hash', () => {
    const fixture = JSON.parse(
      readFileSync(join(fixtureRoot, 'tracebud-import-v1-canonical.fixture.json'), 'utf8'),
    );
    const golden = JSON.parse(
      readFileSync(join(fixtureRoot, 'tracebud-import-v1-canonical.golden.json'), 'utf8'),
    );
    const pkg = assertTracebudImportV1PackageShape(fixture);
    expect(getTracebudImportV1CanonicalMessage(pkg)).toBe(golden.canonicalMessage);
    expect(computeTracebudImportV1ContentHash(pkg)).toBe(golden.contentHashSha256);
  });
});
