'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  getAddProducerCtaLabel,
  getProducerComplianceLabel,
  getProducersEmptyCtaLabel,
  getProducersEmptyFilterMessage,
  getProducersEmptyNoneMessage,
  getProducersFiltersLabel,
  getProducersFilterApplyLabel,
  getProducersFilterClearLabel,
  getProducersFilterComplianceLabel,
  getProducersFilterComplianceOption,
  getProducersFilterDialogDescription,
  getProducersFilterDialogTitle,
  getProducersFilterFpicLabel,
  getProducersFilterFpicOption,
  getProducersFilterStatusLabel,
  getProducersFilterStatusOption,
  getProducersPageSubtitle,
  getProducersPageTitle,
  getProducersSearchPlaceholder,
  getProducersStatCompliantHint,
  getProducersStatCompliantLabel,
  getProducersStatFpicHint,
  getProducersStatFpicLabel,
  getProducersStatPartialHint,
  getProducersStatPartialLabel,
  getProducersStatTotalHint,
  getProducersStatTotalLabel,
  getProducersTableColumnLabel,
  getContactStatusLabel,
  getProducersTableTitle,
} from '@/lib/workflow-terminology-labels';

type ComplianceFilter = 'all' | 'compliant' | 'partial' | 'non_compliant';
type FpicFilter = 'all' | 'signed' | 'pending';

const complianceColors = {
  compliant: 'text-green-400 bg-green-400/10',
  non_compliant: 'text-red-400 bg-red-400/10',
  partial: 'text-yellow-400 bg-yellow-400/10',
};

function deriveComplianceStatus(contact: ContactRecord): 'compliant' | 'non_compliant' | 'partial' {
  if (contact.status === 'blocked' || contact.status === 'inactive') return 'non_compliant';
  if (contact.status === 'submitted' && contact.consent_status === 'granted') return 'compliant';
  return 'partial';
}

export default function FarmersPage() {
  const router = useRouter();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const isExporter = role === 'exporter';
  const [producers, setProducers] = useState<ContactRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [fpicFilter, setFpicFilter] = useState<FpicFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');

  useEffect(() => {
    if (isExporter) {
      router.replace('/contacts');
    }
  }, [isExporter, router]);

  useEffect(() => {
    if (isExporter) return;
    void listContacts()
      .then((contacts) => {
        setProducers(contacts.filter((contact) => contact.contact_type === 'farmer'));
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Failed to load producers.');
        setProducers([]);
      });
  }, [isExporter]);

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

  if (isExporter) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getProducersPageTitle(role, t)}
        description={getProducersPageSubtitle(role, t)}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)}>
              <Filter className="w-4 h-4 mr-2" />
              {getProducersFiltersLabel(t)}
              {activeFilters > 0 ? ` (${activeFilters})` : ''}
            </Button>
            <PermissionGate permission="farmers:create">
              <Button size="sm" asChild>
                <Link href="/farmers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  {getAddProducerCtaLabel(role, t)}
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
              <div className="text-sm font-medium text-muted-foreground">{getProducersStatTotalLabel(role, t)}</div>
              <div className="text-3xl font-bold mt-2">{producers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">{getProducersStatTotalHint(t)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getProducersStatCompliantLabel(t)}</div>
              <div className="text-3xl font-bold text-green-400 mt-2">{compliantCount}</div>
              <p className="text-xs text-muted-foreground mt-2">{getProducersStatCompliantHint(t)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getProducersStatPartialLabel(t)}</div>
              <div className="text-3xl font-bold text-yellow-400 mt-2">{partialCount}</div>
              <p className="text-xs text-muted-foreground mt-2">{getProducersStatPartialHint(t)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{getProducersStatFpicLabel(t)}</div>
              <div className="text-3xl font-bold mt-2">
                {producers.filter((producer) => producer.consent_status === 'granted').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{getProducersStatFpicHint(t)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder={getProducersSearchPlaceholder(role, t)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{getProducersTableTitle(role, t)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getProducersTableColumnLabel('name', t)}</TableHead>
                    <TableHead>{getProducersTableColumnLabel('phone', t)}</TableHead>
                    <TableHead>{getProducersTableColumnLabel('cooperative', t)}</TableHead>
                    <TableHead>{getProducersTableColumnLabel('status', t)}</TableHead>
                    <TableHead>{getProducersTableColumnLabel('fpic', t)}</TableHead>
                    <TableHead>{getProducersTableColumnLabel('compliance', t)}</TableHead>
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
                              {getProducersEmptyNoneMessage(role, t)}
                            </p>
                            <PermissionGate permission="farmers:create">
                              <Button size="sm" asChild>
                                <Link href="/farmers/new">
                                  <Plus className="mr-2 h-4 w-4" />
                                  {getProducersEmptyCtaLabel(role, t)}
                                </Link>
                              </Button>
                            </PermissionGate>
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">
                            {getProducersEmptyFilterMessage(role, t)}
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
                          <TableCell className="text-sm">{getContactStatusLabel(producer.status, t)}</TableCell>
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
                              {getProducerComplianceLabel(compliance, t)}
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
            <DialogTitle>{getProducersFilterDialogTitle(role, t)}</DialogTitle>
            <DialogDescription>{getProducersFilterDialogDescription(role, t)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{getProducersFilterComplianceLabel(t)}</Label>
              <select
                value={complianceFilter}
                onChange={(event) => setComplianceFilter(event.target.value as ComplianceFilter)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">{getProducersFilterComplianceOption('all', t)}</option>
                <option value="compliant">{getProducersFilterComplianceOption('compliant', t)}</option>
                <option value="partial">{getProducersFilterComplianceOption('partial', t)}</option>
                <option value="non_compliant">{getProducersFilterComplianceOption('non_compliant', t)}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{getProducersFilterFpicLabel(t)}</Label>
              <select
                value={fpicFilter}
                onChange={(event) => setFpicFilter(event.target.value as FpicFilter)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">{getProducersFilterFpicOption('all', t)}</option>
                <option value="signed">{getProducersFilterFpicOption('signed', t)}</option>
                <option value="pending">{getProducersFilterFpicOption('pending', t)}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{getProducersFilterStatusLabel(t)}</Label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ContactStatus | 'all')}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">{getProducersFilterStatusOption('all', t)}</option>
                <option value="new">{getProducersFilterStatusOption('new', t)}</option>
                <option value="invited">{getProducersFilterStatusOption('invited', t)}</option>
                <option value="engaged">{getProducersFilterStatusOption('engaged', t)}</option>
                <option value="submitted">{getProducersFilterStatusOption('submitted', t)}</option>
                <option value="inactive">{getProducersFilterStatusOption('inactive', t)}</option>
                <option value="blocked">{getProducersFilterStatusOption('blocked', t)}</option>
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
              {getProducersFilterClearLabel(t)}
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>{getProducersFilterApplyLabel(t)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
