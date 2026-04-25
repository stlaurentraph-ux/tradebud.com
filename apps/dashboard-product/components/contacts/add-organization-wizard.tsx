'use client';

import { useState } from 'react';
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
import { Check, ArrowLeft, ArrowRight, Building2, MapPin, FileText, Users } from 'lucide-react';

const ORG_TYPES = [
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'exporter', label: 'Exporter' },
  { value: 'importer', label: 'Importer' },
  { value: 'processor', label: 'Processor' },
  { value: 'trader', label: 'Trader' },
  { value: 'other', label: 'Other' },
];

const ORG_SIZE = [
  { value: 'micro', label: 'Micro (1-9 employees)' },
  { value: 'small', label: 'Small (10-49 employees)' },
  { value: 'medium', label: 'Medium (50-249 employees)' },
  { value: 'large', label: 'Large (250+ employees)' },
];

const STEPS = ['Basic Info', 'Details', 'Location', 'Review'];

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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={step} totalSteps={4} steps={STEPS} />

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
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the organization&apos;s core details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => updateDraft('name', e.target.value)}
                placeholder="Cooperativa Agrícola XYZ"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org_type">Organization Type</Label>
                <Select
                  value={draft.org_type}
                  onValueChange={(value) => updateDraft('org_type', value)}
                >
                  <SelectTrigger id="org_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
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
                <Label htmlFor="primary_email">Primary Email</Label>
                <Input
                  id="primary_email"
                  type="email"
                  value={draft.primary_email}
                  onChange={(e) => updateDraft('primary_email', e.target.value)}
                  placeholder="contact@organization.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_phone">Primary Phone</Label>
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
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Add more information about the organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={draft.website}
                  onChange={(e) => updateDraft('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Organization Size</Label>
                <Select value={draft.size} onValueChange={(value) => updateDraft('size', value)}>
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_SIZE.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commodities">Commodities</Label>
              <Input
                id="commodities"
                value={draft.commodities}
                onChange={(e) => updateDraft('commodities', e.target.value)}
                placeholder="Coffee, Cocoa, Soy (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                List the primary commodities this organization handles
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Input
                id="certifications"
                value={draft.certifications}
                onChange={(e) => updateDraft('certifications', e.target.value)}
                placeholder="Fair Trade, Organic, Rainforest Alliance"
              />
              <p className="text-xs text-muted-foreground">
                List any relevant certifications (comma-separated)
              </p>
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
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Specify the organization&apos;s location</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={draft.country}
                  onChange={(e) => updateDraft('country', e.target.value)}
                  placeholder="Brazil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region / State</Label>
                <Input
                  id="region"
                  value={draft.region}
                  onChange={(e) => updateDraft('region', e.target.value)}
                  placeholder="Minas Gerais"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={draft.address}
                onChange={(e) => updateDraft('address', e.target.value)}
                placeholder="Street, Number, District, City, Postal Code"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
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
                <CardTitle>Review Organization</CardTitle>
                <CardDescription>Verify the information before saving</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Name</span>
                <span className="text-sm sm:col-span-2">{draft.name || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Type</span>
                <span className="text-sm capitalize sm:col-span-2">{draft.org_type}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Registration</span>
                <span className="text-sm sm:col-span-2">{draft.registration_number || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-sm sm:col-span-2">{draft.primary_email || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                <span className="text-sm sm:col-span-2">{draft.primary_phone || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Website</span>
                <span className="text-sm sm:col-span-2">{draft.website || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Size</span>
                <span className="text-sm capitalize sm:col-span-2">
                  {ORG_SIZE.find((s) => s.value === draft.size)?.label || '—'}
                </span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Commodities</span>
                <span className="text-sm sm:col-span-2">{draft.commodities || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Certifications</span>
                <span className="text-sm sm:col-span-2">{draft.certifications || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Location</span>
                <span className="text-sm sm:col-span-2">
                  {[draft.region, draft.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              {draft.notes && (
                <div className="grid gap-1 p-4 sm:grid-cols-3">
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                  <span className="whitespace-pre-wrap text-sm sm:col-span-2">{draft.notes}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? 'Cancel' : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Organization
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
