'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Key, ShieldCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  listBulkPlotImportSigningKeys,
  registerBulkPlotImportSigningKey,
  revokeBulkPlotImportSigningKey,
  type BulkPlotImportSigningKey,
} from '@/lib/bulk-plot-import';

export default function ImportSigningKeysPage() {
  const [keys, setKeys] = useState<BulkPlotImportSigningKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ kid: '', label: '', publicKeyPem: '' });

  const loadKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setKeys(await listBulkPlotImportSigningKeys());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load signing keys.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const handleRegister = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await registerBulkPlotImportSigningKey(form);
      toast.success('Import signing key registered.');
      setForm({ kid: '', label: '', publicKeyPem: '' });
      await loadKeys();
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
      await loadKeys();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke signing key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGate permission="settings:edit">
      <div className="flex flex-col">
        <AppHeader
          title="Import signing keys"
          description="Register Ed25519 public keys used to verify tracebud_import_v1 packages before bulk plot import."
        />

        <main className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                How signing works
              </CardTitle>
              <CardDescription>
                Unsigned packages remain importable with a warning. If a package includes a signature, Tracebud
                verifies it against an active tenant key and blocks invalid signatures.
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
        </main>
      </div>
    </PermissionGate>
  );
}
