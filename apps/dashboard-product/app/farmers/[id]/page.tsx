'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FarmerDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ConsentGrant {
  id: string;
  type: 'data_use' | 'evidence_collection' | 'shipment_participation';
  grantedAt: string;
  revokedAt?: string;
  status: 'active' | 'revoked';
  notes?: string;
}

interface FarmerDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cooperative: string;
  plots: number;
  verified: boolean;
  fpicSigned: boolean;
  laborCompliant: boolean;
  consentGrants: ConsentGrant[];
  created_at: string;
  updated_at: string;
}

const initialConsentGrants: ConsentGrant[] = [];

export default function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const { id } = use(params);
  const farmerDetail: FarmerDetail = {
    id,
    name: 'Producer',
    phone: '',
    cooperative: 'Unknown',
    plots: 0,
    verified: false,
    fpicSigned: false,
    laborCompliant: false,
    consentGrants: initialConsentGrants,
    created_at: '',
    updated_at: '',
  };

  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>(initialConsentGrants);
  const [isAddConsentOpen, setIsAddConsentOpen] = useState(false);
  const [selectedConsentType, setSelectedConsentType] = useState<ConsentGrant['type']>('data_use');
  const [consentNotes, setConsentNotes] = useState('');

  const handleAddConsent = () => {
    if (!selectedConsentType) return;

    const newConsent: ConsentGrant = {
      id: `consent_${Date.now()}`,
      type: selectedConsentType,
      grantedAt: new Date().toISOString(),
      status: 'active',
      notes: consentNotes || undefined,
    };

    setConsentGrants([newConsent, ...consentGrants]);
    setSelectedConsentType('data_use');
    setConsentNotes('');
    setIsAddConsentOpen(false);
  };

  const handleRevokeConsent = (consentId: string) => {
    setConsentGrants(
      consentGrants.map((g) =>
        g.id === consentId
          ? { ...g, status: 'revoked', revokedAt: new Date().toISOString() }
          : g
      )
    );
  };

  const activeConsentCount = consentGrants.filter((g) => g.status === 'active').length;
  const dataUseConsent = consentGrants.find((g) => g.type === 'data_use' && g.status === 'active');

  const getConsentTypeLabel = (type: ConsentGrant['type']) => {
    switch (type) {
      case 'data_use':
        return 'Data Use';
      case 'evidence_collection':
        return 'Evidence Collection';
      case 'shipment_participation':
        return 'Shipment Participation';
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={farmerDetail.name}
        subtitle={`ID: ${farmerDetail.id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Producers', href: '/farmers' },
          { label: farmerDetail.name },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/farmers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Producers
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Producer detail data is not connected to backend yet for this route. No mock profile is shown.
              </AlertDescription>
            </Alert>
            {/* Producer Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Producer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium mt-1">{farmerDetail.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium mt-1">{farmerDetail.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cooperative</div>
                    <div className="font-medium mt-1">{farmerDetail.cooperative}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Associated Plots</div>
                    <div className="font-medium mt-1">{farmerDetail.plots}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground mb-3">Verification Status</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={farmerDetail.verified ? 'bg-green-500/20 text-green-700 border-green-200' : 'bg-slate-500/20'}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {farmerDetail.verified ? 'Identity Verified' : 'Pending Verification'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={farmerDetail.fpicSigned ? 'bg-green-500/20 text-green-700 border-green-200' : 'bg-red-500/20 text-red-700 border-red-200'}
                    >
                      <FileCheck className="h-3 w-3 mr-1" />
                      {farmerDetail.fpicSigned ? 'FPIC Signed' : 'FPIC Pending'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={farmerDetail.laborCompliant ? 'bg-green-500/20 text-green-700 border-green-200' : 'bg-amber-500/20 text-amber-700 border-amber-200'}
                    >
                      {farmerDetail.laborCompliant ? '✓ Labor Compliant' : '⚠ Labor Issues'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consent Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">Producer Consent Grants</CardTitle>
                <PermissionGate permission="farmers:edit">
                  <Dialog open={isAddConsentOpen} onOpenChange={setIsAddConsentOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Consent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Grant Producer Consent</DialogTitle>
                        <DialogDescription>
                          Record a consent grant for {farmerDetail.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Consent Type</Label>
                          <div className="space-y-2 mt-2">
                            {['data_use', 'evidence_collection', 'shipment_participation'].map((type) => (
                              <button
                                key={type}
                                onClick={() => setSelectedConsentType(type as ConsentGrant['type'])}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                  selectedConsentType === type
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:bg-secondary/50'
                                }`}
                              >
                                <div className="font-medium text-sm">{getConsentTypeLabel(type as ConsentGrant['type'])}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {type === 'data_use' && 'Permission to use producer data in shipments'}
                                  {type === 'evidence_collection' && 'Permission to collect evidence from producer'}
                                  {type === 'shipment_participation' && 'Permission to include producer in shipments'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            placeholder="e.g., granted via in-person meeting"
                            value={consentNotes}
                            onChange={(e) => setConsentNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddConsentOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddConsent}>Record Consent</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </PermissionGate>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dataUseConsent && (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      No active data use consent. Producer data cannot be used in shipments until consent is granted.
                    </AlertDescription>
                  </Alert>
                )}

                {consentGrants.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">No consent grants recorded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {consentGrants.map((grant) => (
                      <div
                        key={grant.id}
                        className="flex items-start justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{getConsentTypeLabel(grant.type)}</span>
                            <Badge
                              variant="outline"
                              className={
                                grant.status === 'active'
                                  ? 'bg-green-500/20 text-green-700 border-green-200'
                                  : 'bg-slate-500/20 text-slate-700 border-slate-200'
                              }
                            >
                              {grant.status === 'active' ? 'Active' : 'Revoked'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Granted: {new Date(grant.grantedAt).toLocaleDateString()}
                            </div>
                            {grant.revokedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Revoked: {new Date(grant.revokedAt).toLocaleDateString()}
                              </div>
                            )}
                            {grant.notes && <div className="text-xs">{grant.notes}</div>}
                          </div>
                        </div>
                        {grant.status === 'active' && (
                          <PermissionGate permission="farmers:edit">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeConsent(grant.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Consent Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-green-600">{activeConsentCount}</div>
                  <div className="text-xs text-muted-foreground">Active Consents</div>
                </div>
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Can Participate In:</div>
                  <div className="space-y-1">
                    {consentGrants
                      .filter((g) => g.status === 'active')
                      .map((g) => (
                        <div key={g.id} className="text-xs p-1.5 rounded bg-green-500/10 text-green-700">
                          ✓ {getConsentTypeLabel(g.type)}
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <div className="text-muted-foreground mb-1">Shipment Eligible</div>
                  {dataUseConsent ? (
                    <Badge className="bg-green-500/20 text-green-700 border-green-200" variant="outline">
                      ✓ Yes - Active Consent
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-700 border-red-200" variant="outline">
                      ✗ No Consent
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
