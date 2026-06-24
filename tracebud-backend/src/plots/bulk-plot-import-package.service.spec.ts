import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'crypto';
import {
  assertTracebudImportV1PackageShape,
  computeTracebudImportV1ContentHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  type TracebudImportV1PackageInput,
} from './bulk-plot-import-package.util';
import { BulkPlotImportIntegratorKeyService } from './bulk-plot-import-integrator-key.service';
import { BulkPlotImportPackageService } from './bulk-plot-import-package.service';
import { BulkPlotImportPolicyService } from './bulk-plot-import-policy.service';
import { BulkPlotImportSigningKeyService } from './bulk-plot-import-signing-key.service';

function buildService(deps?: {
  signingKeys?: Partial<BulkPlotImportSigningKeyService>;
  integratorKeys?: Partial<BulkPlotImportIntegratorKeyService>;
  policy?: Partial<BulkPlotImportPolicyService>;
  pool?: { query: jest.Mock };
}) {
  const pool = deps?.pool ?? { query: jest.fn().mockResolvedValue({ rows: [] }) };
  const signingKeys =
    deps?.signingKeys ??
    ({
      resolveActiveKey: jest.fn(),
    } as unknown as BulkPlotImportSigningKeyService);
  const integratorKeys =
    deps?.integratorKeys ??
    ({
      resolveActiveKey: jest.fn(),
    } as unknown as BulkPlotImportIntegratorKeyService);
  const policy =
    deps?.policy ??
    ({
      getPolicy: jest.fn().mockResolvedValue({
        tenantId: 'tenant_1',
        requireSignedPackages: false,
        acceptIntegratorSignatures: false,
        updatedAt: null,
      }),
      assertSignedPackagesRequired: jest.fn().mockResolvedValue(undefined),
    } as unknown as BulkPlotImportPolicyService);
  return {
    packageService: new BulkPlotImportPackageService(
      signingKeys as BulkPlotImportSigningKeyService,
      integratorKeys as BulkPlotImportIntegratorKeyService,
      policy as BulkPlotImportPolicyService,
      pool as never,
    ),
    signingKeys: signingKeys as BulkPlotImportSigningKeyService,
    integratorKeys: integratorKeys as BulkPlotImportIntegratorKeyService,
    policy: policy as BulkPlotImportPolicyService,
    pool,
  };
}

const basePackage = {
  format_version: 'tracebud_import_v1',
  source_system: 'legacy_gis_export',
  exported_at: '2026-06-24T10:00:00.000Z',
  producers: [{ producer_ref: 'P1', full_name: 'Maria', country_iso: 'HN' }],
  plots: [
    {
      client_plot_id: 'PLOT-1',
      producer_ref: 'P1',
      country_iso: 'HN',
      geolocation_mode: 'POINT',
      declared_area_ha: 1,
      geometry: { type: 'Point', coordinates: [-87.1, 14.1] },
    },
  ],
};

describe('bulk plot import package verification', () => {
  it('returns unsigned when package has no signature', async () => {
    const { packageService } = buildService();
    const result = await packageService.verifyPackage({
      tenantId: 'tenant_1',
      pkg: assertTracebudImportV1PackageShape(basePackage),
    });
    expect(result.signatureStatus).toBe('unsigned');
    expect(result.contentHashValid).toBe(true);
  });

  it('verifies a valid ed25519 signature', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const pkg = assertTracebudImportV1PackageShape(basePackage);
    const message = getTracebudImportV1CanonicalMessage(pkg);
    const signatureValue = sign(null, Buffer.from(message, 'utf8'), createPrivateKey(privateKeyPem)).toString(
      'base64',
    );
    const signedPackage: TracebudImportV1PackageInput = {
      ...pkg,
      signature: {
        algorithm: 'ed25519',
        kid: 'coop-key-1',
        value: signatureValue,
      },
    };

    const { packageService, signingKeys } = buildService();
    (signingKeys.resolveActiveKey as jest.Mock).mockResolvedValue({
      kid: 'coop-key-1',
      label: 'Coop export key',
      public_key_pem: publicKeyPem,
    });

    const result = await packageService.verifyPackage({
      tenantId: 'tenant_1',
      pkg: signedPackage,
    });

    expect(result.signatureStatus).toBe('verified');
    expect(result.signerType).toBe('tenant');
    expect(result.signingKeyLabel).toBe('Coop export key');
    expect(
      verify(
        null,
        Buffer.from(message, 'utf8'),
        createPublicKey(publicKeyPem),
        Buffer.from(signatureValue, 'base64'),
      ),
    ).toBe(true);
  });

  it('verifies integrator keys when tenant accepts integrator signatures', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const pkg = assertTracebudImportV1PackageShape(basePackage);
    const message = getTracebudImportV1CanonicalMessage(pkg);
    const signatureValue = sign(null, Buffer.from(message, 'utf8'), createPrivateKey(privateKeyPem)).toString(
      'base64',
    );
    const signedPackage: TracebudImportV1PackageInput = {
      ...pkg,
      signature: {
        algorithm: 'ed25519',
        kid: 'integrator-key-1',
        value: signatureValue,
      },
    };

    const { packageService, signingKeys, integratorKeys, policy } = buildService();
    (signingKeys.resolveActiveKey as jest.Mock).mockResolvedValue(null);
    (policy.getPolicy as jest.Mock).mockResolvedValue({
      tenantId: 'tenant_1',
      requireSignedPackages: false,
      acceptIntegratorSignatures: true,
      updatedAt: null,
    });
    (integratorKeys.resolveActiveKey as jest.Mock).mockResolvedValue({
      integrator_id: 'tracebud_partner_a',
      kid: 'integrator-key-1',
      label: 'Partner A export key',
      public_key_pem: publicKeyPem,
    });

    const result = await packageService.verifyPackage({
      tenantId: 'tenant_1',
      pkg: signedPackage,
    });

    expect(result.signatureStatus).toBe('verified');
    expect(result.signerType).toBe('integrator');
    expect(result.integratorId).toBe('tracebud_partner_a');
  });

  it('fails when content hash does not match', async () => {
    const { packageService } = buildService();
    const result = await packageService.verifyPackage({
      tenantId: 'tenant_1',
      pkg: assertTracebudImportV1PackageShape({
        ...basePackage,
        content_hash_sha256: 'deadbeef',
      }),
    });
    expect(result.signatureStatus).toBe('failed');
    expect(result.contentHashValid).toBe(false);
  });

  it('computes stable content hashes', () => {
    const pkg = assertTracebudImportV1PackageShape(basePackage);
    const hash = computeTracebudImportV1ContentHash(pkg);
    expect(hash).toHaveLength(64);
    expect(createHash('sha256').update(getTracebudImportV1CanonicalMessage(pkg), 'utf8').digest('hex')).toBe(
      hash,
    );
  });

  it('rejects legacy string signatures', () => {
    expect(() =>
      parseTracebudImportV1PackageSignature(
        assertTracebudImportV1PackageShape({
          ...basePackage,
          signature: 'legacy-base64-signature',
        }),
      ),
    ).toThrow('object with algorithm, kid, and value');
  });
});

describe('BulkPlotImportSigningKeyService.registerKey', () => {
  it('normalizes valid ed25519 public keys', () => {
    const { publicKey } = generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const service = new BulkPlotImportSigningKeyService({ query: jest.fn() } as never);
    const normalized = service.normalizePublicKeyPem(publicKeyPem);
    expect(normalized).toContain('BEGIN PUBLIC KEY');
  });
});
