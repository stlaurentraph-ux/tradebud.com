'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Link2,
  Hash,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/common/permission-gate';
import { StatusChip } from '@/components/ui/status-chip';
import { Timeline, type TimelineEvent } from '@/components/ui/timeline-row';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface FPICDocument {
  id: string;
  name: string;
  type: 'community_minutes' | 'consent_form' | 'agreement' | 'affidavit';
  farmer_or_community: string;
  upload_date: string;
  expiry_date: string;
  status: 'verified' | 'pending_review' | 'expired' | 'renewal_due';
  file_size_mb: number;
  // Provenance chain fields
  sha256_hash: string;
  uploader_name: string;
  uploader_org: string;
  linked_entities: {
    type: 'farmer' | 'plot' | 'shipment';
    id: string;
    label: string;
  }[];
  review_history: TimelineEvent[];
}

const mockDocuments: FPICDocument[] = process.env.NODE_ENV !== 'production' ? [
  {
    id: 'doc_001',
    name: 'Member Consent Renewal - Amina N.',
    type: 'consent_form',
    farmer_or_community: 'Amina N.',
    upload_date: '2026-04-18T11:00:00.000Z',
    expiry_date: '2027-04-18T00:00:00.000Z',
    status: 'verified',
    file_size_mb: 1.3,
    sha256_hash: 'f3c2b4a99172f6cc8c10f52f9fd3bf054dd1b1a47d8827ca63a557884f59b8a3',
    uploader_name: 'Grace M.',
    uploader_org: 'Kilimani Cooperative',
    linked_entities: [
      { type: 'farmer', id: 'member_447', label: 'Amina N.' },
      { type: 'plot', id: 'plot_117', label: 'Nyota Block A' },
    ],
    review_history: [
      {
        id: 'ev1',
        eventType: 'document_uploaded',
        timestamp: '2026-04-18T11:00:00.000Z',
        userName: 'Grace M.',
        description: 'Consent form uploaded',
        metadata: { source: 'field_tablet' },
      },
      {
        id: 'ev2',
        eventType: 'approval',
        timestamp: '2026-04-18T14:25:00.000Z',
        userName: 'Compliance Desk',
        description: 'Consent verification approved',
        metadata: { verification: 'signature_and_id_match' },
      },
    ],
  },
  {
    id: 'doc_002',
    name: 'Portability Release Statement - Member 812',
    type: 'agreement',
    farmer_or_community: 'Member 812',
    upload_date: '2026-04-20T09:30:00.000Z',
    expiry_date: '2026-10-20T00:00:00.000Z',
    status: 'pending_review',
    file_size_mb: 2.1,
    sha256_hash: '4a8267e1138f22fe6458f8e7f87f732f43da5d6f3fcb5e5156d3f53a8b1a1dc4',
    uploader_name: 'Field Agent Team 2',
    uploader_org: 'Kilimani Cooperative',
    linked_entities: [
      { type: 'farmer', id: 'member_812', label: 'Member 812' },
      { type: 'shipment', id: 'PORT-2026-009', label: 'Portability Request #009' },
    ],
    review_history: [
      {
        id: 'ev3',
        eventType: 'document_uploaded',
        timestamp: '2026-04-20T09:30:00.000Z',
        userName: 'Field Agent Team 2',
        description: 'Portability release uploaded',
        metadata: { campaign: 'portability_drive_q2' },
      },
    ],
  },
] : [];

const docTypeLabels: Record<FPICDocument['type'], string> = {
  'community_minutes': 'Community Minutes',
  'consent_form': 'Consent Form',
  'agreement': 'Agreement',
  'affidavit': 'Affidavit',
};

const statusToChipStatus: Record<FPICDocument['status'], 'APPROVED' | 'PENDING' | 'REJECTED' | 'WARNING'> = {
  verified: 'APPROVED',
  pending_review: 'PENDING',
  renewal_due: 'WARNING',
  expired: 'REJECTED',
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function DocumentCard({ doc, expanded, onToggle }: { doc: FPICDocument; expanded: boolean; onToggle: () => void }) {
  return (
    <Card className={cn('transition-shadow', expanded ? 'shadow-md ring-1 ring-primary/20' : 'hover:shadow-md')}>
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
                  {docTypeLabels[doc.type]} - {doc.farmer_or_community}
                </p>
              </div>
            </div>

            {/* Document Details Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{doc.file_size_mb}</span> MB
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="text-muted-foreground">
                Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
              </div>
              <span className="text-muted-foreground">-</span>
              <div className={cn(
                'font-medium',
                doc.status === 'expired' || doc.status === 'renewal_due'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}>
                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
              </div>
            </div>

            {/* SHA-256 Hash (always visible, truncated) */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <code className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {doc.sha256_hash.slice(0, 16)}...{doc.sha256_hash.slice(-8)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => copyToClipboard(doc.sha256_hash)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusChip status={statusToChipStatus[doc.status]} size="sm" />
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onToggle}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Provenance Section */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            {/* Provenance Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Uploader</p>
                <p className="font-medium">{doc.uploader_name}</p>
                <p className="text-muted-foreground text-xs">{doc.uploader_org}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Full SHA-256 Hash</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                    {doc.sha256_hash}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => copyToClipboard(doc.sha256_hash)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Linked Entities */}
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Linked entities
              </p>
              <div className="flex flex-wrap gap-2">
                {doc.linked_entities.map((entity) => (
                  <Badge
                    key={entity.id}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-secondary/80"
                  >
                    {entity.type === 'farmer' && '👤'}
                    {entity.type === 'plot' && '📍'}
                    {entity.type === 'shipment' && '📦'}
                    {entity.label}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Review History Timeline */}
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Review history
              </p>
              <div className="bg-muted/50 rounded-lg p-3">
                <Timeline 
                  events={doc.review_history} 
                  maxHeight={150}
                  compact
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <PermissionGate permission="fpic:view">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View full document
                </Button>
              </PermissionGate>
              <PermissionGate permission="fpic:upload">
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </PermissionGate>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FPICRepositoryPage() {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const isCooperative = user?.active_role === 'cooperative';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending_review' | 'renewal_due' | 'expired'>('all');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const filteredDocs = mockDocuments.filter((doc) => {
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.farmer_or_community.toLowerCase().includes(query) ||
      docTypeLabels[doc.type].toLowerCase().includes(query) ||
      doc.sha256_hash.toLowerCase().includes(query)
    );
  });

  const verified = mockDocuments.filter((d) => d.status === 'verified').length;
  const pending = mockDocuments.filter((d) => d.status === 'pending_review').length;
  const renewalDue = mockDocuments.filter((d) => d.status === 'renewal_due').length;
  const expired = mockDocuments.filter((d) => d.status === 'expired').length;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={isImporter ? 'Evidence' : 'FPIC Repository'}
        subtitle={
          isImporter
            ? 'Review, complete, and retain evidence for shipment and declaration defensibility'
            : isCooperative
            ? 'Manage consent, portability, and cooperative evidence with full provenance chain'
            : 'Manage Free Prior Informed Consent documents with full provenance chain'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: isImporter ? 'Evidence' : isCooperative ? 'Evidence' : 'FPIC Repository' },
        ]}
        actions={
          <PermissionGate permission="fpic:upload">
            <Button asChild>
              <Link href="/fpic/upload">
                <Plus className="mr-2 h-4 w-4" />
                {isImporter ? 'Upload evidence' : 'Upload document'}
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
                <p className="text-sm text-muted-foreground">
                  {isImporter ? 'Total evidence records' : isCooperative ? 'Total evidence files' : 'Total documents'}
                </p>
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
                <p className="text-sm text-muted-foreground">{isCooperative ? 'Consent review queue' : 'Pending review'}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{isCooperative ? 'Consent renewal due' : 'Renewal due'}</p>
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
                placeholder={
                  isImporter
                    ? 'Search by evidence title, shipment reference, partner, or hash...'
                    : isCooperative
                      ? 'Search by member, plot, shipment, consent artifact, or hash...'
                      : 'Search by name, farmer, community, or hash...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {(['all', 'verified', 'pending_review', 'renewal_due', 'expired'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
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
              <p className="mt-4 text-sm text-muted-foreground">
                {isImporter ? 'No evidence records match your filters' : 'No documents match your filters'}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                expanded={expandedDoc === doc.id}
                onToggle={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              />
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  {isImporter ? 'Evidence provenance and audit trail' : 'Provenance chain and audit trail'}
                </p>
                <p className="text-blue-800 mt-1">
                  Each document is hashed with SHA-256 at upload time. The hash, uploader identity, timestamp,
                  and linked entities form an immutable provenance chain. Click any document to expand its full
                  audit history. {isCooperative ? 'Consent and portability artifacts are retained and traceable across member transfers. ' : ''}
                  All records are retained for 5 years per EUDR requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
