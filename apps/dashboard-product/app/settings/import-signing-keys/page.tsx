'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Key, ShieldCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  getBulkPlotImportPolicy,
  listBulkPlotImportIntegratorKeys,
  listBulkPlotImportSigningKeys,
  registerBulkPlotImportSigningKey,
  revokeBulkPlotImportSigningKey,
  updateBulkPlotImportPolicy,
  type BulkPlotImportIntegratorKey,
  type BulkPlotImportPolicy,
  type BulkPlotImportSigningKey,
} from '@/lib/bulk-plot-import';

export default function ImportSigningKeysPage() {
  const [keys, setKeys] = useState<BulkPlotImportSigningKey[]>([]);
  const [integratorKeys, setIntegratorKeys] = useState<BulkPlotImportIntegratorKey[]>([]);
  const [policy, setPolicy] = useState<BulkPlotImportPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ kid: '', label: '', publicKeyPem: '' });

  const loadPage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tenantKeys, importPolicy, approvedIntegratorKeys] = await Promise.all([
        listBulkPlotImportSigningKeys(),
        getBulkPlotImportPolicy(),
        listBulkPlotImportIntegratorKeys(),
      ]);
      setKeys(tenantKeys);
      setPolicy(importPolicy);
      setIntegratorKeys(approvedIntegratorKeys);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load import signing settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const handleRegister = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await registerBulkPlotImportSigningKey(form);
      toast.success('Import signing key registered.');
      setForm({ kid: '', label: '', publicKeyPem: '' });
      await loadPage();
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Could not register signing key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await revokeBulkPlotImportSigningKey(keyId);
      toast.success('Signing key revoked.');
      await loadPage();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke signing key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePolicyChange = async (patch: {
    requireSignedPackages?: boolean;
    acceptIntegratorSignatures?: boolean;
  }) => {
    if (!policy) return;
    setIsSaving(true);
    setError(null);
    try {
      const next = await updateBulkPlotImportPolicy({
        requireSignedPackages: patch.requireSignedPackages ?? policy.requireSignedPackages,
        acceptIntegratorSignatures: patch.acceptIntegratorSignatures ?? policy.acceptIntegratorSignatures,
      });
      setPolicy(next);
      toast.success('Import policy updated.');
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : 'Could not update import policy.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGate permission="settings:edit">
      <div className="flex flex-col">
        <AppHeader
          title="Import signing keys"
          description="Register Ed25519 public keys and policy for tracebud_import_v1 package verification."
        />

        <main className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                How signing works
              </CardTitle>
              <CardDescription>
                Unsigned packages remain importable by default. When a package includes a signature, Tracebud verifies
                it against tenant keys or approved integrator keys and blocks invalid signatures.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Paste the PEM public key from your export tool and choose a stable key id (`kid`).</p>
              <p>
                Export tools should sign the canonical package JSON (same payload used for `content_hash_sha256`).
              </p>
              <p>
                Need to import plots?{' '}
                <Link href="/plots/bulk-upload" className="text-primary hover:underline">
                  Open bulk plot import
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <PermissionGate permission="settings:edit">
            <Card>
              <CardHeader>
                <CardTitle>Import policy</CardTitle>
                <CardDescription>
                  Applies to tracebud_import_v1 package imports only. CSV, GeoJSON, and KML uploads are unaffected.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Checkbox
                    id="require-signed-packages"
                    checked={policy?.requireSignedPackages ?? false}
                    disabled={isLoading || isSaving || !policy}
                    onCheckedChange={(checked) =>
                      void handlePolicyChange({ requireSignedPackages: checked === true })
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="require-signed-packages" className="font-medium">
                      Require signed packages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Block unsigned tracebud_import_v1 packages for this organisation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Checkbox
                    id="accept-integrator-signatures"
                    checked={policy?.acceptIntegratorSignatures ?? false}
                    disabled={isLoading || isSaving || !policy}
                    onCheckedChange={(checked) =>
                      void handlePolicyChange({ acceptIntegratorSignatures: checked === true })
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="accept-integrator-signatures" className="font-medium">
                      Accept Tracebud-approved integrator signatures
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow packages signed with global integrator keys when the tenant key is not registered locally.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permission="settings:edit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Register public key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signing-kid">Key id (kid)</Label>
                    <Input
                      id="signing-kid"
                      value={form.kid}
                      onChange={(event) => setForm((current) => ({ ...current, kid: event.target.value }))}
                      placeholder="coop-export-key-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signing-label">Label</Label>
                    <Input
                      id="signing-label"
                      value={form.label}
                      onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Legacy GIS export key"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signing-public-key">Ed25519 public key (PEM)</Label>
                  <textarea
                    id="signing-public-key"
                    value={form.publicKeyPem}
                    onChange={(event) => setForm((current) => ({ ...current, publicKeyPem: event.target.value }))}
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                    placeholder="-----BEGIN PUBLIC KEY-----"
                  />
                </div>
                <Button
                  onClick={() => void handleRegister()}
                  disabled={isSaving || !form.kid.trim() || !form.label.trim() || !form.publicKeyPem.trim()}
                >
                  Register key
                </Button>
              </CardContent>
            </Card>
          </PermissionGate>

          <Card>
            <CardHeader>
              <CardTitle>Tenant keys</CardTitle>
              <CardDescription>Active and revoked keys for this organisation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {isLoading ? <p className="text-sm text-muted-foreground">Loading keys…</p> : null}
              {!isLoading && keys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No signing keys registered yet.</p>
              ) : null}
              {keys.map((key) => (
                <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{key.label}</p>
                      <Badge variant="secondary">{key.kid}</Badge>
                      {key.revokedAt ? <Badge variant="destructive">Revoked</Badge> : <Badge>Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fingerprint …{key.publicKeyFingerprint} · {key.algorithm}
                    </p>
                  </div>
                  {!key.revokedAt ? (
                    <Button variant="outline" disabled={isSaving} onClick={() => void handleRevoke(key.id)}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracebud-approved integrator keys</CardTitle>
              <CardDescription>
                Global keys maintained by Tracebud. Enable integrator acceptance above to trust these signers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="text-sm text-muted-foreground">Loading integrator keys…</p> : null}
              {!isLoading && integratorKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No integrator keys are published yet.</p>
              ) : null}
              {integratorKeys.map((key) => (
                <div key={key.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{key.label}</p>
                    <Badge variant="secondary">{key.kid}</Badge>
                    <Badge variant="outline">{key.integratorId}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fingerprint …{key.publicKeyFingerprint}
                    {key.allowedSourceSystems.length > 0
                      ? ` · source systems: ${key.allowedSourceSystems.join(', ')}`
                      : ' · all source systems'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
