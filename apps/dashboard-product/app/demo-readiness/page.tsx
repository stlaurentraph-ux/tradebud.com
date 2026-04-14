'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Play, ShieldCheck } from 'lucide-react';
import { usePackages } from '@/lib/use-packages';
import { useAdminData } from '@/lib/use-admin-data';
import { resetDemoWorkspace, seedGoldenPathWorkspace } from '@/lib/demo-bootstrap';
import { emitAuditEvent } from '@/lib/audit-events';
import { toast } from 'sonner';

const CHECKS = [
  'Producer inbox has actionable pending requests',
  'Supplier can move package DRAFT -> READY -> SEALED -> SUBMITTED',
  'Buyer can ACCEPT and REJECT submitted packages',
  'Sponsor can see governance dashboard and escalation signals',
  'Admin can invite users and reassign roles',
  'Error states include retry actions on key pages',
];

export default function DemoReadinessPage() {
  const [isMutating, setIsMutating] = useState(false);
  const { packages } = usePackages();
  const { users } = useAdminData();

  const hasSubmitted = packages.some((p) => p.status === 'SUBMITTED');
  const hasDecision = packages.some((p) => p.status === 'ACCEPTED' || p.status === 'REJECTED');
  const hasEscalation = packages.some((p) => p.status === 'ON_HOLD' || p.compliance_status === 'BLOCKED');
  const hasCoopAndImporter = users.some((u) => u.roles.includes('cooperative')) && users.some((u) => u.roles.includes('importer'));

  const signals = [
    { label: 'Submitted package exists', pass: hasSubmitted },
    { label: 'Buyer decision exists', pass: hasDecision },
    { label: 'Escalation scenario exists', pass: hasEscalation },
    { label: 'Producer + Buyer users present', pass: hasCoopAndImporter },
  ];
  const passed = signals.filter((s) => s.pass).length;

  const runBootstrapAction = async (
    action: 'seed_golden_path' | 'reset_demo_workspace',
    runner: () => Promise<void>
  ) => {
    setIsMutating(true);
    try {
      await runner();
      await emitAuditEvent({
        event_type: 'SHIPMENT_UPDATED',
        entity_type: 'demo_workspace',
        entity_id: action,
        payload: { action, timestamp: new Date().toISOString() },
      });
      toast.success(action === 'seed_golden_path' ? 'Golden path seeded.' : 'Demo workspace reset.');
    } catch {
      toast.error('Action failed. Please retry.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Demo Readiness"
        subtitle="Operational checklist and status for customer demo quality"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Demo Readiness' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Readiness Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current readiness score</p>
              <Badge variant={passed === signals.length ? 'default' : 'outline'}>{passed}/{signals.length}</Badge>
            </div>
            {signals.map((signal) => (
              <div key={signal.label} className="flex items-center gap-2 text-sm">
                {signal.pass ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{signal.label}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isMutating}
                onClick={() => {
                  void runBootstrapAction('seed_golden_path', seedGoldenPathWorkspace);
                }}
              >
                {isMutating ? 'Working...' : 'Seed Golden Path'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isMutating}
                onClick={() => {
                  void runBootstrapAction('reset_demo_workspace', resetDemoWorkspace);
                }}
              >
                {isMutating ? 'Working...' : 'Reset Demo'}
              </Button>
              <Button size="sm" asChild>
                <Link href="/inbox">
                  <Play className="mr-2 h-3.5 w-3.5" />
                  Start Producer Flow
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Demo Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHECKS.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <Circle className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <span>{item}</span>
              </div>
            ))}
            <div className="pt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports">Open Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

