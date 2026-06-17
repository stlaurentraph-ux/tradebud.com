'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/app-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getHarvestVoucherEmptyMessage,
  getHarvestVoucherLoadingMessage,
  getHarvestVoucherSectionDescription,
  getPackageCreateBackLabel,
  getPackageCreateInfoCardTitle,
  getPackageCreatePreviewTitle,
  getPackageCreateSubmitLabel,
  getPackageCreateSubtitle,
  getPackageCreateSuccessToast,
  getPackageCreateTitle,
  getPackagesPageTitle,
} from '@/lib/workflow-terminology-labels';
import {
  buildPackageLabel,
  createHarvestPackage,
  listTenantHarvestVouchers,
  type TenantHarvestVoucher,
} from '@/lib/harvest-voucher-client';
import {
  DASHBOARD_EVENTS,
  trackDashboardEvent,
  trackUiActionFailure,
} from '@/lib/observability/analytics';
import {
  hasPackageCreateErrors,
  validatePackageCreateForm,
  type PackageCreateFieldErrors,
} from '@/lib/package-create-validation';

const PACKAGE_CREATE_ROLES = new Set(['exporter', 'cooperative', 'compliance_manager', 'admin']);

function formatHarvestDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export default function NewPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const canCreatePackage = PACKAGE_CREATE_ROLES.has(user?.active_role ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(true);
  const [voucherLoadError, setVoucherLoadError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<TenantHarvestVoucher[]>([]);
  const [showIneligible, setShowIneligible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PackageCreateFieldErrors>({});
  const [formData, setFormData] = useState({
    supplier_name: '',
    season: 'A',
    year: new Date().getFullYear(),
    notes: '',
    voucherIds: [] as string[],
  });

  useEffect(() => {
    if (!canCreatePackage) {
      setIsLoadingVouchers(false);
      return;
    }

    let cancelled = false;
    setIsLoadingVouchers(true);
    setVoucherLoadError(null);

    listTenantHarvestVouchers()
      .then((rows) => {
        if (!cancelled) {
          setVouchers(rows);
          const preset = searchParams?.get('voucherIds')?.trim();
          if (preset) {
            const allowed = new Set(
              rows.filter((row) => row.eligible_for_package).map((row) => row.id),
            );
            const ids = preset
              .split(',')
              .map((id) => id.trim())
              .filter((id) => allowed.has(id));
            if (ids.length > 0) {
              setFormData((prev) => ({ ...prev, voucherIds: ids }));
            }
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setVoucherLoadError(
            error instanceof Error ? error.message : 'Failed to load harvest vouchers.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingVouchers(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canCreatePackage, searchParams]);

  const eligibleVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.eligible_for_package),
    [vouchers],
  );
  const visibleVouchers = useMemo(
    () => (showIneligible ? vouchers : eligibleVouchers),
    [eligibleVouchers, showIneligible, vouchers],
  );
  const selectedVouchers = useMemo(
    () => vouchers.filter((voucher) => formData.voucherIds.includes(voucher.id)),
    [formData.voucherIds, vouchers],
  );
  const totalSelectedKg = useMemo(
    () => selectedVouchers.reduce((sum, voucher) => sum + (voucher.kg ?? 0), 0),
    [selectedVouchers],
  );

  const validationErrors = useMemo(
    () => validatePackageCreateForm(formData, role, t),
    [formData, role, t],
  );
  const isFormValid = !hasPackageCreateErrors(validationErrors);

  const toggleVoucher = (voucher: TenantHarvestVoucher, checked: boolean) => {
    setFormData((prev) => {
      const nextIds = checked
        ? [...prev.voucherIds, voucher.id]
        : prev.voucherIds.filter((id) => id !== voucher.id);
      return { ...prev, voucherIds: nextIds };
    });
    if (fieldErrors.voucherIds) {
      setFieldErrors((prev) => ({ ...prev, voucherIds: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreatePackage) {
      toast.error('Your role cannot create packages. Ask an exporter or cooperative operator.');
      return;
    }

    const errors = validatePackageCreateForm(formData, role, t);
    setFieldErrors(errors);
    if (hasPackageCreateErrors(errors)) {
      toast.error('Fix validation errors before creating this record.');
      trackUiActionFailure('package_create', { reason: 'validation' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createHarvestPackage({
        voucherIds: formData.voucherIds,
        label: buildPackageLabel(formData),
      });
      toast.success(getPackageCreateSuccessToast(role, t));
      trackDashboardEvent(DASHBOARD_EVENTS.PACKAGE_CREATE_SUCCESS, {
        packageId: created.id,
        voucherCount: formData.voucherIds.length,
        role: user?.active_role ?? 'unknown',
      });
      router.push(`/packages/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create package.';
      toast.error(message);
      trackDashboardEvent(DASHBOARD_EVENTS.PACKAGE_CREATE_FAILURE, {
        voucherCount: formData.voucherIds.length,
        role: user?.active_role ?? 'unknown',
        reason: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getPackageCreateTitle(role, t)}
        subtitle={getPackageCreateSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getPackagesPageTitle(role, t), href: '/packages' },
          { label: getPackageCreateTitle(role, t) },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getPackageCreateBackLabel(role, t)}
          </Link>
        </Button>

        {!canCreatePackage ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Package creation is limited to exporter, cooperative, compliance manager, and admin
              roles. You can review existing packages from the list view.
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">{getPackageCreateInfoCardTitle(role, t)}</CardTitle>
                  <CardDescription>
                    Label metadata for the package record. Harvest vouchers are linked in the next
                    section.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="supplier_name" className="text-sm font-medium">
                      Supplier / Cooperative Name *
                    </label>
                    <Input
                      id="supplier_name"
                      placeholder="e.g., Rwanda Coffee Cooperative"
                      value={formData.supplier_name}
                      onChange={(e) => {
                        setFormData({ ...formData, supplier_name: e.target.value });
                        if (fieldErrors.supplier_name) {
                          setFieldErrors((prev) => ({ ...prev, supplier_name: undefined }));
                        }
                      }}
                      className="bg-secondary"
                      aria-invalid={Boolean(fieldErrors.supplier_name)}
                      required
                      disabled={!canCreatePackage}
                    />
                    {fieldErrors.supplier_name ? (
                      <p className="text-xs text-destructive">{fieldErrors.supplier_name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Used in the package label for downstream traceability
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="season" className="text-sm font-medium">
                        Season *
                      </label>
                      <select
                        id="season"
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-secondary px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                        disabled={!canCreatePackage}
                      >
                        <option value="A">Season A (Jan-Jun)</option>
                        <option value="B">Season B (Jul-Dec)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="year" className="text-sm font-medium">
                        Year *
                      </label>
                      <Input
                        id="year"
                        type="number"
                        min={2020}
                        max={2030}
                        value={formData.year}
                        onChange={(e) => {
                          setFormData({ ...formData, year: Number(e.target.value) });
                          if (fieldErrors.year) {
                            setFieldErrors((prev) => ({ ...prev, year: undefined }));
                          }
                        }}
                        className="bg-secondary"
                        aria-invalid={Boolean(fieldErrors.year)}
                        required
                        disabled={!canCreatePackage}
                      />
                      {fieldErrors.year ? (
                        <p className="text-xs text-destructive">{fieldErrors.year}</p>
                      ) : null}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Any additional notes about this package..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="flex min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={4}
                      disabled={!canCreatePackage}
                    />
                    {fieldErrors.notes ? (
                      <p className="text-xs text-destructive">{fieldErrors.notes}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Harvest Vouchers</CardTitle>
                      <CardDescription>
                        {getHarvestVoucherSectionDescription(role, t)}
                      </CardDescription>
                    </div>
                    {vouchers.some((voucher) => !voucher.eligible_for_package) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowIneligible((value) => !value)}
                        disabled={!canCreatePackage || isLoadingVouchers}
                      >
                        {showIneligible ? 'Hide ineligible' : 'Show ineligible'}
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingVouchers ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {getHarvestVoucherLoadingMessage(role, t)}
                    </div>
                  ) : voucherLoadError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{voucherLoadError}</AlertDescription>
                    </Alert>
                  ) : visibleVouchers.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {getHarvestVoucherEmptyMessage(role, showIneligible, t)}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {visibleVouchers.map((voucher) => {
                        const isSelected = formData.voucherIds.includes(voucher.id);
                        const isDisabled =
                          !canCreatePackage ||
                          !voucher.eligible_for_package ||
                          Boolean(voucher.dds_package_id);

                        return (
                          <div
                            key={voucher.id}
                            className="flex items-start gap-3 rounded-lg border border-border p-3"
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => {
                                if (!isDisabled) {
                                  toggleVoucher(voucher, checked === true);
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {voucher.plot_name?.trim() || 'Unnamed plot'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {voucher.qr_code_ref} • {formatHarvestDate(voucher.harvest_date)}
                              </div>
                              {!voucher.eligible_for_package ? (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  Not eligible — plot must be verified deforestation-free and
                                  unassigned
                                </p>
                              ) : null}
                              {voucher.dds_package_id ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Already linked to a package
                                </p>
                              ) : null}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-medium">
                                {voucher.kg != null ? `${voucher.kg.toLocaleString()} kg` : '—'}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {voucher.status ?? 'unknown'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {fieldErrors.voucherIds ? (
                    <p className="text-xs text-destructive">{fieldErrors.voucherIds}</p>
                  ) : null}

                  {formData.voucherIds.length > 0 ? (
                    <Card className="bg-secondary/50 border-border">
                      <CardContent className="pt-4">
                        <div className="text-sm">
                          <div className="text-muted-foreground">Selected vouchers</div>
                          <div className="text-lg font-semibold">
                            {formData.voucherIds.length} • {totalSelectedKg.toLocaleString()} kg
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">{getPackageCreatePreviewTitle(role, t)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Label</p>
                    <p className="text-sm text-foreground">
                      {formData.supplier_name.trim()
                        ? buildPackageLabel(formData)
                        : 'Not specified'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Vouchers</p>
                    <p className="text-sm text-foreground">
                      {formData.voucherIds.length > 0
                        ? `${formData.voucherIds.length} selected (${totalSelectedKg.toLocaleString()} kg)`
                        : 'None selected'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Initial Status</p>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Draft
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !isFormValid || !canCreatePackage}
                  >
                    {isSubmitting ? (
                      getPackageCreateSubmitLabel(role, true, t)
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {getPackageCreateSubmitLabel(role, false, t)}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/packages">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
