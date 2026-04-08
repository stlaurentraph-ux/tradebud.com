'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, Trash2, Download } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/common/permission-gate';
import { cn } from '@/lib/utils';

interface FPICDocument {
  id: string;
  name: string;
  type: 'community_minutes' | 'consent_form' | 'agreement' | 'affidavit';
  farmer_or_community: string;
  upload_date: string;
  expiry_date: string;
  status: 'verified' | 'pending_review' | 'expired' | 'renewal_due';
  file_size_mb: number;
}

// Mock FPIC documents
const mockDocuments: FPICDocument[] = [
  {
    id: 'fpic-1',
    name: 'Community Assembly Minutes - January 2024',
    type: 'community_minutes',
    farmer_or_community: 'Cocoa Farmers Cooperative #12',
    upload_date: '2024-01-15',
    expiry_date: '2025-01-15',
    status: 'verified',
    file_size_mb: 2.4,
  },
  {
    id: 'fpic-2',
    name: 'Free Prior Informed Consent Form',
    type: 'consent_form',
    farmer_or_community: 'Juan Martinez',
    upload_date: '2024-02-01',
    expiry_date: '2025-02-01',
    status: 'verified',
    file_size_mb: 1.1,
  },
  {
    id: 'fpic-3',
    name: 'Community Land Agreement',
    type: 'agreement',
    farmer_or_community: 'Cocoa Farmers Cooperative #12',
    upload_date: '2023-08-20',
    expiry_date: '2024-08-20',
    status: 'renewal_due',
    file_size_mb: 3.2,
  },
  {
    id: 'fpic-4',
    name: 'Farmer Consent Affidavit',
    type: 'affidavit',
    farmer_or_community: 'Maria Gonzalez',
    upload_date: '2024-01-10',
    expiry_date: '2024-12-31',
    status: 'pending_review',
    file_size_mb: 0.8,
  },
  {
    id: 'fpic-5',
    name: 'Assembly Minutes - Land Rights',
    type: 'community_minutes',
    farmer_or_community: 'Indigenous Community Council',
    upload_date: '2023-06-15',
    expiry_date: '2023-12-15',
    status: 'expired',
    file_size_mb: 2.1,
  },
];

const docTypeLabels: Record<FPICDocument['type'], string> = {
  'community_minutes': 'Community Minutes',
  'consent_form': 'Consent Form',
  'agreement': 'Agreement',
  'affidavit': 'Affidavit',
};

function getStatusBadge(status: FPICDocument['status']) {
  const config = {
    verified: {
      icon: CheckCircle,
      color: 'bg-emerald-500/20 text-emerald-600',
      label: 'Verified',
    },
    pending_review: {
      icon: Clock,
      color: 'bg-blue-500/20 text-blue-600',
      label: 'Pending Review',
    },
    renewal_due: {
      icon: AlertCircle,
      color: 'bg-amber-500/20 text-amber-600',
      label: 'Renewal Due',
    },
    expired: {
      icon: AlertCircle,
      color: 'bg-destructive/20 text-destructive',
      label: 'Expired',
    },
  };
  const { icon: Icon, color, label } = config[status];
  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function FPICRepositoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending_review' | 'renewal_due' | 'expired'>('all');

  const filteredDocs = mockDocuments.filter((doc) => {
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.farmer_or_community.toLowerCase().includes(query) ||
      docTypeLabels[doc.type].toLowerCase().includes(query)
    );
  });

  const verified = mockDocuments.filter((d) => d.status === 'verified').length;
  const pending = mockDocuments.filter((d) => d.status === 'pending_review').length;
  const renewalDue = mockDocuments.filter((d) => d.status === 'renewal_due').length;
  const expired = mockDocuments.filter((d) => d.status === 'expired').length;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="FPIC Repository"
        subtitle="Manage Free Prior Informed Consent documents for audit-grade compliance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'FPIC Repository' },
        ]}
        actions={
          <PermissionGate permission="fpic:upload">
            <Button asChild>
              <Link href="/fpic/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold mt-1">{mockDocuments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{verified}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Renewal Due</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{renewalDue}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive mt-1">{expired}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Input
                placeholder="Search by document name, farmer, or community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {(['all', 'verified', 'pending_review', 'renewal_due', 'expired'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize"
                  >
                    {status === 'all'
                      ? 'All'
                      : status === 'verified'
                      ? 'Verified'
                      : status === 'pending_review'
                      ? 'Pending'
                      : status === 'renewal_due'
                      ? 'Renewal'
                      : 'Expired'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">No documents match your filters</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Document Icon & Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {docTypeLabels[doc.type]} • {doc.farmer_or_community}
                          </p>
                        </div>
                      </div>

                      {/* Document Details Row */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="text-muted-foreground">
                          <span className="font-medium text-foreground">{doc.file_size_mb}</span> MB
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <div className="text-muted-foreground">
                          Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <div className={cn(
                          'font-medium',
                          doc.status === 'expired' || doc.status === 'renewal_due'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        )}>
                          Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getStatusBadge(doc.status)}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <PermissionGate permission="fpic:delete">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  FPIC Documentation & Audit Trail
                </p>
                <p className="text-blue-800 mt-1">
                  A single digital signature is insufficient to prove FPIC during an audit. This repository stores PDFs, photos, 
                  and scans of community assembly minutes, consent forms, and agreements. All documents are retained for exactly 
                  5 years as required by EUDR regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
