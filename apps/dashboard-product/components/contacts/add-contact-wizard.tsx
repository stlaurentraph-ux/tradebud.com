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
import { Check, ArrowLeft, ArrowRight, User, Building2, MapPin, FileText } from 'lucide-react';
import type { ContactType } from '@/lib/contact-service';

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'exporter', label: 'Exporter' },
  { value: 'other', label: 'Other' },
];

const CONSENT_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'granted', label: 'Granted' },
  { value: 'revoked', label: 'Revoked' },
];

const STEPS = ['Basic Info', 'Organization', 'Location', 'Review'];

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
}

export function AddContactWizard({ onComplete, onCancel }: AddContactWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ContactDraft>({
    full_name: '',
    email: '',
    phone: '',
    contact_type: 'farmer',
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
      setError(err instanceof Error ? err.message : 'Failed to create contact.');
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
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the contact&apos;s personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-destructive">*</span>
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
                  Email <span className="text-destructive">*</span>
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => updateDraft('phone', e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_type">Contact Type</Label>
                <Select
                  value={draft.contact_type}
                  onValueChange={(value) => updateDraft('contact_type', value as ContactType)}
                >
                  <SelectTrigger id="contact_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consent_status">Consent Status</Label>
              <Select
                value={draft.consent_status}
                onValueChange={(value) =>
                  updateDraft('consent_status', value as 'unknown' | 'granted' | 'revoked')
                }
              >
                <SelectTrigger id="consent_status">
                  <SelectValue placeholder="Select consent status" />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Add organization and role information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name</Label>
                <Input
                  id="organization"
                  value={draft.organization}
                  onChange={(e) => updateDraft('organization', e.target.value)}
                  placeholder="Acme Farms Co."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title / Role</Label>
                <Input
                  id="job_title"
                  value={draft.job_title}
                  onChange={(e) => updateDraft('job_title', e.target.value)}
                  placeholder="Farm Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={draft.tags}
                onChange={(e) => updateDraft('tags', e.target.value)}
                placeholder="coffee, organic, premium (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
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
                <CardDescription>Specify the contact&apos;s location</CardDescription>
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
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={draft.address}
                onChange={(e) => updateDraft('address', e.target.value)}
                placeholder="123 Farm Road, Rural District"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
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
                <CardTitle>Review Contact</CardTitle>
                <CardDescription>Verify the information before saving</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                <span className="text-sm sm:col-span-2">{draft.full_name || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-sm sm:col-span-2">{draft.email || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                <span className="text-sm sm:col-span-2">{draft.phone || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Contact Type</span>
                <span className="text-sm capitalize sm:col-span-2">{draft.contact_type}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Organization</span>
                <span className="text-sm sm:col-span-2">{draft.organization || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Job Title</span>
                <span className="text-sm sm:col-span-2">{draft.job_title || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Location</span>
                <span className="text-sm sm:col-span-2">
                  {[draft.region, draft.country].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Tags</span>
                <span className="text-sm sm:col-span-2">{draft.tags || '—'}</span>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-3">
                <span className="text-sm font-medium text-muted-foreground">Consent</span>
                <span className="text-sm capitalize sm:col-span-2">{draft.consent_status}</span>
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
                <Check className="mr-2 h-4 w-4" /> Save Contact
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
