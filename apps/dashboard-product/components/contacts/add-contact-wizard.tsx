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
  getContactConsentLabel,
  getContactTypeLabel,
  getContactsWizardActionLabel,
  getContactsWizardCreateError,
  getContactsWizardFieldLabel,
  getContactsWizardLockedTypeLabel,
  getContactsWizardPlaceholder,
  getContactsWizardSectionCopy,
  getContactsWizardStepLabel,
  getContactsWizardTagsHint,
} from '@/lib/workflow-terminology-labels';
import { Check, ArrowLeft, ArrowRight, User, Building2, MapPin, FileText } from 'lucide-react';
import type { ContactType } from '@/lib/contact-service';
import type { ContactActivityType } from '@/lib/contact-activity-types';

const DEFAULT_CONTACT_TYPE_VALUES: ContactActivityType[] = ['farmer', 'cooperative', 'exporter', 'other'];
const CONSENT_VALUES = ['unknown', 'granted', 'revoked'] as const;

interface ContactDraft {
  full_name: string;
  email: string;
  phone: string;
  contact_type: ContactType;
  organization: string;
  job_title: string;
  country: string;
  region: string;
  address: string;
  tags: string;
  consent_status: 'unknown' | 'granted' | 'revoked';
  notes: string;
}

interface AddContactWizardProps {
  onComplete: (data: ContactDraft) => Promise<void>;
  onCancel: () => void;
  defaultContactType?: ContactType;
  lockContactType?: boolean;
  lockedTypeLabel?: string;
  isCooperative?: boolean;
  activityTypes?: ContactActivityType[];
}

export function AddContactWizard({
  onComplete,
  onCancel,
  defaultContactType = 'farmer',
  lockContactType = false,
  lockedTypeLabel = 'Producer',
  isCooperative = false,
  activityTypes,
}: AddContactWizardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const contactTypeOptions = activityTypes ?? DEFAULT_CONTACT_TYPE_VALUES;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      getContactsWizardStepLabel('basic', t),
      getContactsWizardStepLabel('organization', t),
      getContactsWizardStepLabel('location', t),
      getContactsWizardStepLabel('review', t),
    ],
    [t],
  );

  const [draft, setDraft] = useState<ContactDraft>({
    full_name: '',
    email: '',
    phone: '',
    contact_type: defaultContactType,
    organization: '',
    job_title: '',
    country: '',
    region: '',
    address: '',
    tags: '',
    consent_status: 'unknown',
    notes: '',
  });

  const updateDraft = <K extends keyof ContactDraft>(field: K, value: ContactDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) {
      return draft.full_name.trim() !== '' && draft.email.trim() !== '';
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
      setError(err instanceof Error ? err.message : getContactsWizardCreateError(t));
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
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsWizardSectionCopy('basic', 'title', isCooperative, t)}</CardTitle>
                <CardDescription>{getContactsWizardSectionCopy('basic', 'subtitle', isCooperative, t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {getContactsWizardFieldLabel('full_name', t)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={draft.full_name}
                  onChange={(e) => updateDraft('full_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {getContactsWizardFieldLabel('email', t)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => updateDraft('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{getContactsWizardFieldLabel('phone', t)}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => updateDraft('phone', e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_type">
                  {lockContactType
                    ? getContactsWizardLockedTypeLabel(lockedTypeLabel, t)
                    : getContactsWizardFieldLabel('contact_type', t)}
                </Label>
                {lockContactType ? (
                  <Input id="contact_type" value={lockedTypeLabel} readOnly disabled />
                ) : (
                  <Select
                    value={draft.contact_type}
                    onValueChange={(value) => updateDraft('contact_type', value as ContactType)}
                  >
                    <SelectTrigger id="contact_type">
                      <SelectValue placeholder={getContactsWizardPlaceholder('select_type', t)} />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getContactTypeLabel(type, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consent_status">{getContactsWizardFieldLabel('consent_status', t)}</Label>
              <Select
                value={draft.consent_status}
                onValueChange={(value) =>
                  updateDraft('consent_status', value as 'unknown' | 'granted' | 'revoked')
                }
              >
                <SelectTrigger id="consent_status">
                  <SelectValue placeholder={getContactsWizardPlaceholder('select_consent', t)} />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getContactConsentLabel(value, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsWizardSectionCopy('organization', 'title', isCooperative, t)}</CardTitle>
                <CardDescription>
                  {getContactsWizardSectionCopy('organization', 'subtitle', isCooperative, t)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">{getContactsWizardFieldLabel('organization', t)}</Label>
                <Input
                  id="organization"
                  value={draft.organization}
                  onChange={(e) => updateDraft('organization', e.target.value)}
                  placeholder="Acme Farms Co."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">{getContactsWizardFieldLabel('job_title', t)}</Label>
                <Input
                  id="job_title"
                  value={draft.job_title}
                  onChange={(e) => updateDraft('job_title', e.target.value)}
                  placeholder="Farm Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{getContactsWizardFieldLabel('tags', t)}</Label>
              <Input
                id="tags"
                value={draft.tags}
                onChange={(e) => updateDraft('tags', e.target.value)}
                placeholder="coffee, organic, premium (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">{getContactsWizardTagsHint(t)}</p>
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
                <CardTitle>{getContactsWizardSectionCopy('location', 'title', isCooperative, t)}</CardTitle>
                <CardDescription>{getContactsWizardSectionCopy('location', 'subtitle', isCooperative, t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">{getContactsWizardFieldLabel('country', t)}</Label>
                <Input
                  id="country"
                  value={draft.country}
                  onChange={(e) => updateDraft('country', e.target.value)}
                  placeholder="Brazil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">{getContactsWizardFieldLabel('region', t)}</Label>
                <Input
                  id="region"
                  value={draft.region}
                  onChange={(e) => updateDraft('region', e.target.value)}
                  placeholder="Minas Gerais"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{getContactsWizardFieldLabel('address', t)}</Label>
              <Textarea
                id="address"
                value={draft.address}
                onChange={(e) => updateDraft('address', e.target.value)}
                placeholder="123 Farm Road, Rural District"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{getContactsWizardFieldLabel('notes', t)}</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(e) => updateDraft('notes', e.target.value)}
                placeholder="Any additional information about this contact..."
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
                <CardTitle>{getContactsWizardSectionCopy('review', 'title', isCooperative, t)}</CardTitle>
                <CardDescription>{getContactsWizardSectionCopy('review', 'subtitle', isCooperative, t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('full_name', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.full_name || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('email', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.email || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('phone', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.phone || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('contact_type', t)}
                </span>
                <span className="text-sm sm:col-span-2">{getContactTypeLabel(draft.contact_type, t)}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('organization', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.organization || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('job_title', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.job_title || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('location', t)}
                </span>
                <span className="text-sm sm:col-span-2">
                  {[draft.region, draft.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('tags', t)}
                </span>
                <span className="text-sm sm:col-span-2">{draft.tags || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {getContactsWizardFieldLabel('consent_status', t)}
                </span>
                <span className="text-sm sm:col-span-2">{getContactConsentLabel(draft.consent_status, t)}</span>
              </div>
              {draft.notes && (
                <div className="grid gap-1 p-4 sm:grid-cols-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getContactsWizardFieldLabel('notes', t)}
                  </span>
                  <span className="whitespace-pre-wrap text-sm sm:col-span-2">{draft.notes}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? (
            getContactsWizardActionLabel('cancel', t)
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" /> {getContactsWizardActionLabel('back', t)}
            </>
          )}
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            {getContactsWizardActionLabel('next', t)} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              getContactsWizardActionLabel('saving', t)
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />{' '}
                {getContactsWizardActionLabel(isCooperative ? 'save_member' : 'save_contact', t)}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
