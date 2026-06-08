'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionGate } from '@/components/common/permission-gate';
import { Plus, Filter, ChevronRight, User, CheckCircle, AlertCircle } from 'lucide-react';
import { listContacts, type ContactRecord, type ContactStatus } from '@/lib/contact-service';

type ComplianceFilter = 'all' | 'compliant' | 'partial' | 'non_compliant';
type FpicFilter = 'all' | 'signed' | 'pending';

const complianceColors = {
  compliant: 'text-green-400 bg-green-400/10',
  non_compliant: 'text-red-400 bg-red-400/10',
  partial: 'text-yellow-400 bg-yellow-400/10',
};

const complianceLabels = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  partial: 'Partial',
};

function deriveComplianceStatus(contact: ContactRecord): 'compliant' | 'non_compliant' | 'partial' {
  if (contact.status === 'blocked' || contact.status === 'inactive') return 'non_compliant';
  if (contact.status === 'submitted' && contact.consent_status === 'granted') return 'compliant';
  return 'partial';
}

export default function FarmersPage() {
  const [producers, setProducers] = useState<ContactRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [fpicFilter, setFpicFilter] = useState<FpicFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');

  useEffect(() => {
    void listContacts()
      .then((contacts) => {
        setProducers(contacts.filter((contact) => contact.contact_type === 'farmer'));
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Failed to load producers.');
        setProducers([]);
      });
  }, []);

  const filteredFarmers = useMemo(() => {
    return producers.filter((producer) => {
      const compliance = deriveComplianceStatus(producer);
      const fpicSigned = producer.consent_status === 'granted';
      const matchesSearch =
        producer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producer.organization ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        producer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompliance = complianceFilter === 'all' || compliance === complianceFilter;
      const matchesFpic =
        fpicFilter === 'all' ||
        (fpicFilter === 'signed' && fpicSigned) ||
        (fpicFilter === 'pending' && !fpicSigned);
      const matchesStatus = statusFilter === 'all' || producer.status === statusFilter;
      return matchesSearch && matchesCompliance && matchesFpic && matchesStatus;
    });
  }, [producers, searchTerm, complianceFilter, fpicFilter, statusFilter]);

  const compliantCount = producers.filter((producer) => deriveComplianceStatus(producer) === 'compliant').length;
  const partialCount = producers.filter((producer) => deriveComplianceStatus(producer) === 'partial').length;
  const activeFilters =
    (complianceFilter !== 'all' ? 1 : 0) +
    (fpicFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Producers"
        description="Manage producer identities, onboarding status, and linked plot portfolios"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </Button>
            <PermissionGate permission="farmers:create">
              <Button size="sm" asChild>
                <Link href="/farmers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Producer
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {loadError ? (
          <Card className="border-red-300">
            <CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Producers</div>
              <div className="text-3xl font-bold mt-2">{producers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Active in directory</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Compliant</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{compliantCount}</div>
              <p className="text-xs text-muted-foreground mt-2">All requirements met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Partial Compliance</div>
              <div className="text-3xl font-bold text-yellow-400 mt-2">{partialCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Some requirements pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">With FPIC Consent</div>
              <div className="text-3xl font-bold mt-2">
                {producers.filter((producer) => producer.consent_status === 'granted').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Consent granted</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder="Search by producer name, email, or cooperative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered Producers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Cooperative</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>FPIC</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8">
                        {producers.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-muted-foreground">
                              No producers yet. Add your first producer to start building your upstream directory.
                            </p>
                            <PermissionGate permission="farmers:create">
                              <Button size="sm" asChild>
                                <Link href="/farmers/new">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add first producer
                                </Link>
                              </Button>
                            </PermissionGate>
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">
                            No producers match your search or filters.
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFarmers.map((producer) => {
                      const compliance = deriveComplianceStatus(producer);
                      const fpicSigned = producer.consent_status === 'granted';
                      return (
                        <TableRow key={producer.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {producer.full_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{producer.phone ?? '—'}</TableCell>
                          <TableCell className="text-sm">{producer.organization ?? '—'}</TableCell>
                          <TableCell className="text-sm capitalize">{producer.status}</TableCell>
                          <TableCell>
                            {fpicSigned ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${complianceColors[compliance]}`}
                            >
                              {complianceLabels[compliance]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/farmers/${producer.id}`}>
                              <Button variant="ghost" size="icon">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter producers</DialogTitle>
            <DialogDescription>Narrow the producer directory by compliance, consent, and onboarding status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Compliance</Label>
              <select
                value={complianceFilter}
                onChange={(event) => setComplianceFilter(event.target.value as ComplianceFilter)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All compliance states</option>
                <option value="compliant">Compliant</option>
                <option value="partial">Partial</option>
                <option value="non_compliant">Non-compliant</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>FPIC consent</Label>
              <select
                value={fpicFilter}
                onChange={(event) => setFpicFilter(event.target.value as FpicFilter)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All consent states</option>
                <option value="signed">Consent granted</option>
                <option value="pending">Consent pending</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Onboarding status</Label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ContactStatus | 'all')}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="invited">Invited</option>
                <option value="engaged">Engaged</option>
                <option value="submitted">Submitted</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setComplianceFilter('all');
                setFpicFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
