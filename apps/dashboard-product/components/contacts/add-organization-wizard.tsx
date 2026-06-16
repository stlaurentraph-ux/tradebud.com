'use client';

import { useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import { LocaleContext } from '@/lib/locale-context';
import {
  getContactsOrganizationWizardLabel,
  getOrganizationSizeLabel,
  getOrganizationTypeLabel,
} from '@/lib/workflow-terminology-labels';
import { Check, ArrowLeft, ArrowRight, Building2, MapPin, FileText, Users } from 'lucide-react';

const ORG_TYPES = ['cooperative', 'exporter', 'importer', 'processor', 'trader', 'other'] as const;
const ORG_SIZE = ['micro', 'small', 'medium', 'large'] as const;

interface OrganizationDraft {
  name: string;
  org_type: string;
  registration_number: string;
  primary_email: string;
  primary_phone: string;
  website: string;
  size: string;
  commodities: string;
  certifications: string;
  country: string;
  region: string;
  address: string;
  notes: string;
}

interface AddOrganizationWizardProps {
  onComplete: (data: OrganizationDraft) => Promise<void>;
  onCancel: () => void;
}

export function AddOrganizationWizard({ onComplete, onCancel }: AddOrganizationWizardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      getContactsOrganizationWizardLabel('step_basic', t),
      getContactsOrganizationWizardLabel('step_details', t),
      getContactsOrganizationWizardLabel('step_location', t),
      getContactsOrganizationWizardLabel('step_review', t),
    ],
    [t],
  );

  const [draft, setDraft] = useState<OrganizationDraft>({
    name: '',
    org_type: 'cooperative',
    registration_number: '',
    primary_email: '',
    primary_phone: '',
    website: '',
    size: 'small',
    commodities: '',
    certifications: '',
    country: '',
    region: '',
    address: '',
    notes: '',
  });

  const updateDraft = <K extends keyof OrganizationDraft>(field: K, value: OrganizationDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) {
      return draft.name.trim() !== '';
    }
    return true;
  };

  const handleNext = () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : getContactsOrganizationWizardLabel('error_create', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={step} totalSteps={4} steps={steps} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsOrganizationWizardLabel('basic_title', t)}</CardTitle>
                <CardDescription>{getContactsOrganizationWizardLabel('basic_subtitle', t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {getContactsOrganizationWizardLabel('field_name', t)} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => updateDraft('name', e.target.value)}
                placeholder="Cooperativa Agricola XYZ"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org_type">{getContactsOrganizationWizardLabel('field_type', t)}</Label>
                <Select value={draft.org_type} onValueChange={(value) => updateDraft('org_type', value)}>
                  <SelectTrigger id="org_type">
                    <SelectValue placeholder={getContactsOrganizationWizardLabel('placeholder_select_type', t)} />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getOrganizationTypeLabel(type, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">{getContactsOrganizationWizardLabel('field_registration', t)}</Label>
                <Input
                  id="registration_number"
                  value={draft.registration_number}
                  onChange={(e) => updateDraft('registration_number', e.target.value)}
                  placeholder="CNPJ or Tax ID"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary_email">{getContactsOrganizationWizardLabel('field_email', t)}</Label>
                <Input
                  id="primary_email"
                  type="email"
                  value={draft.primary_email}
                  onChange={(e) => updateDraft('primary_email', e.target.value)}
                  placeholder="contact@organization.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_phone">{getContactsOrganizationWizardLabel('field_phone', t)}</Label>
                <Input
                  id="primary_phone"
                  type="tel"
                  value={draft.primary_phone}
                  onChange={(e) => updateDraft('primary_phone', e.target.value)}
                  placeholder="+55 11 3000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsOrganizationWizardLabel('details_title', t)}</CardTitle>
                <CardDescription>{getContactsOrganizationWizardLabel('details_subtitle', t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">{getContactsOrganizationWizardLabel('field_website', t)}</Label>
                <Input
                  id="website"
                  type="url"
                  value={draft.website}
                  onChange={(e) => updateDraft('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">{getContactsOrganizationWizardLabel('field_size', t)}</Label>
                <Select value={draft.size} onValueChange={(value) => updateDraft('size', value)}>
                  <SelectTrigger id="size">
                    <SelectValue placeholder={getContactsOrganizationWizardLabel('placeholder_select_size', t)} />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_SIZE.map((size) => (
                      <SelectItem key={size} value={size}>
                        {getOrganizationSizeLabel(size, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commodities">{getContactsOrganizationWizardLabel('field_commodities', t)}</Label>
              <Input
                id="commodities"
                value={draft.commodities}
                onChange={(e) => updateDraft('commodities', e.target.value)}
                placeholder="Coffee, Cocoa, Soy (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">{getContactsOrganizationWizardLabel('hint_commodities', t)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">{getContactsOrganizationWizardLabel('field_certifications', t)}</Label>
              <Input
                id="certifications"
                value={draft.certifications}
                onChange={(e) => updateDraft('certifications', e.target.value)}
                placeholder="Fair Trade, Organic, Rainforest Alliance"
              />
              <p className="text-xs text-muted-foreground">{getContactsOrganizationWizardLabel('hint_certifications', t)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsOrganizationWizardLabel('location_title', t)}</CardTitle>
                <CardDescription>{getContactsOrganizationWizardLabel('location_subtitle', t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">{getContactsOrganizationWizardLabel('field_country', t)}</Label>
                <Input
                  id="country"
                  value={draft.country}
                  onChange={(e) => updateDraft('country', e.target.value)}
                  placeholder="Brazil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">{getContactsOrganizationWizardLabel('field_region', t)}</Label>
                <Input
                  id="region"
                  value={draft.region}
                  onChange={(e) => updateDraft('region', e.target.value)}
                  placeholder="Minas Gerais"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{getContactsOrganizationWizardLabel('field_address', t)}</Label>
              <Textarea
                id="address"
                value={draft.address}
                onChange={(e) => updateDraft('address', e.target.value)}
                placeholder="Street, Number, District, City, Postal Code"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{getContactsOrganizationWizardLabel('field_notes', t)}</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(e) => updateDraft('notes', e.target.value)}
                placeholder="Any additional information about this organization..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsOrganizationWizardLabel('review_title', t)}</CardTitle>
                <CardDescription>{getContactsOrganizationWizardLabel('review_subtitle', t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_name', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.name || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_type', t)}</span>
                <span className="text-sm sm:col-span-2">{getOrganizationTypeLabel(draft.org_type as (typeof ORG_TYPES)[number], t)}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_registration', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.registration_number || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_email', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.primary_email || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_phone', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.primary_phone || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_website', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.website || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_size', t)}</span>
                <span className="text-sm sm:col-span-2">{getOrganizationSizeLabel(draft.size as (typeof ORG_SIZE)[number], t)}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_commodities', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.commodities || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_certifications', t)}</span>
                <span className="text-sm sm:col-span-2">{draft.certifications || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_location', t)}</span>
                <span className="text-sm sm:col-span-2">
                  {[draft.region, draft.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              {draft.notes && (
                <div className="grid gap-1 p-4 sm:grid-cols-3">
                  <span className="text-sm font-medium text-muted-foreground">{getContactsOrganizationWizardLabel('field_notes', t)}</span>
                  <span className="whitespace-pre-wrap text-sm sm:col-span-2">{draft.notes}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? getContactsOrganizationWizardLabel('action_cancel', t) : <><ArrowLeft className="mr-2 h-4 w-4" /> {getContactsOrganizationWizardLabel('action_back', t)}</>}
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            {getContactsOrganizationWizardLabel('action_next', t)} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              getContactsOrganizationWizardLabel('action_saving', t)
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> {getContactsOrganizationWizardLabel('action_save', t)}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
