'use client';

import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LocaleContext } from '@/lib/locale-context';
import type { ContactActivityType, ProcessingFacilitySubtype } from '@/lib/contact-activity-types';
import type { ContactDirectoryRole } from '@/lib/contact-activity-types';
import { listContactActivityTypesForRole, listProcessingFacilitySubtypes } from '@/lib/contact-activity-types';
import type { ContactRecord } from '@/lib/contact-service';
import { validateFarmerContactDraft } from '@/lib/crm-contact-reachability';
import {
  getContactConsentLabel,
  getContactTypeLabel,
  getContactsWizardFieldLabel,
  getContactsWizardTagsHint,
  getProcessingSubtypeLabel,
  getContactDetailActionLabel,
} from '@/lib/workflow-terminology-labels';

const CONSENT_VALUES = ['unknown', 'granted', 'revoked'] as const;

export interface ContactEditDraft {
  full_name: string;
  email: string;
  phone: string;
  phoneOnlyNoEmail: boolean;
  organization: string;
  contact_type: ContactActivityType;
  processing_subtype: ProcessingFacilitySubtype | null;
  country: string;
  tags: string;
  consent_status: 'unknown' | 'granted' | 'revoked';
}

interface EditContactFormProps {
  contact: ContactRecord;
  role?: ContactDirectoryRole;
  activityTypes: ContactActivityType[];
  onSave: (draft: ContactEditDraft) => Promise<void>;
  onCancel: () => void;
}

function draftFromContact(contact: ContactRecord): ContactEditDraft {
  const isPhoneOnlyFarmer =
    contact.contact_type === 'farmer' && !contact.email?.trim() && Boolean(contact.phone?.trim());
  return {
    full_name: contact.full_name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    phoneOnlyNoEmail: isPhoneOnlyFarmer,
    organization: contact.organization ?? '',
    contact_type: contact.contact_type,
    processing_subtype: contact.processing_subtype,
    country: contact.country ?? '',
    tags: contact.tags.join(', '),
    consent_status: contact.consent_status,
  };
}

export function EditContactForm({
  contact,
  role,
  activityTypes,
  onSave,
  onCancel,
}: EditContactFormProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [draft, setDraft] = useState<ContactEditDraft>(() => draftFromContact(contact));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtypeOptions = listProcessingFacilitySubtypes();
  const resolvedActivityTypes = activityTypes.length > 0 ? activityTypes : listContactActivityTypesForRole(role);

  const updateDraft = <K extends keyof ContactEditDraft>(field: K, value: ContactEditDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.full_name.trim()) {
      setError('Name is required.');
      return;
    }
    if (draft.contact_type === 'farmer') {
      const reachability = validateFarmerContactDraft({
        email: draft.email,
        phone: draft.phone,
        phoneOnlyNoEmail: draft.phoneOnlyNoEmail,
      });
      if (reachability.error) {
        setError(reachability.error);
        return;
      }
    } else if (!draft.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit_full_name">{getContactsWizardFieldLabel('full_name', t)}</Label>
          <Input
            id="edit_full_name"
            value={draft.full_name}
            onChange={(event) => updateDraft('full_name', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_email">
            {getContactsWizardFieldLabel('email', t)}
            {draft.contact_type === 'farmer' && draft.phoneOnlyNoEmail ? null : (
              <span className="text-destructive"> *</span>
            )}
          </Label>
          <Input
            id="edit_email"
            type="email"
            value={draft.email}
            onChange={(event) => updateDraft('email', event.target.value)}
            disabled={draft.contact_type === 'farmer' && draft.phoneOnlyNoEmail}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_phone">
            {getContactsWizardFieldLabel('phone', t)}
            {draft.contact_type === 'farmer' && draft.phoneOnlyNoEmail ? (
              <span className="text-destructive"> *</span>
            ) : null}
          </Label>
          <Input
            id="edit_phone"
            type="tel"
            value={draft.phone}
            onChange={(event) => updateDraft('phone', event.target.value)}
            placeholder={draft.phoneOnlyNoEmail ? '+233241234567' : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_organization">{getContactsWizardFieldLabel('organization', t)}</Label>
          <Input
            id="edit_organization"
            value={draft.organization}
            onChange={(event) => updateDraft('organization', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_contact_type">{getContactsWizardFieldLabel('contact_type', t)}</Label>
          <Select
            value={draft.contact_type}
            onValueChange={(value) => {
              const nextType = value as ContactActivityType;
              updateDraft('contact_type', nextType);
              if (nextType !== 'processing_facility') {
                updateDraft('processing_subtype', null);
              }
            }}
          >
            <SelectTrigger id="edit_contact_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resolvedActivityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getContactTypeLabel(type, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.contact_type === 'processing_facility' ? (
          <div className="space-y-2">
            <Label htmlFor="edit_processing_subtype">
              {getContactsWizardFieldLabel('processing_subtype', t)}
            </Label>
            <Select
              value={draft.processing_subtype ?? ''}
              onValueChange={(value) =>
                updateDraft('processing_subtype', value ? (value as ProcessingFacilitySubtype) : null)
              }
            >
              <SelectTrigger id="edit_processing_subtype">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {subtypeOptions.map((subtype) => (
                  <SelectItem key={subtype} value={subtype}>
                    {getProcessingSubtypeLabel(subtype, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="edit_country">{getContactsWizardFieldLabel('country', t)}</Label>
          <Input
            id="edit_country"
            value={draft.country}
            onChange={(event) => updateDraft('country', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_consent">{getContactsWizardFieldLabel('consent_status', t)}</Label>
          <Select
            value={draft.consent_status}
            onValueChange={(value) =>
              updateDraft('consent_status', value as 'unknown' | 'granted' | 'revoked')
            }
          >
            <SelectTrigger id="edit_consent">
              <SelectValue />
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edit_tags">{getContactsWizardFieldLabel('tags', t)}</Label>
          <Input
            id="edit_tags"
            value={draft.tags}
            onChange={(event) => updateDraft('tags', event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{getContactsWizardTagsHint(t)}</p>
        </div>
      </div>
      {draft.contact_type === 'farmer' ? (
        <div className="rounded-md border border-dashed p-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id="edit_phone_only_no_email"
              checked={draft.phoneOnlyNoEmail}
              onCheckedChange={(checked) => updateDraft('phoneOnlyNoEmail', checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="edit_phone_only_no_email" className="font-normal">
                No email — use phone only
              </Label>
              <p className="text-xs text-muted-foreground">
                Use when the producer has no email. Outreach will use WhatsApp when available.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? getContactDetailActionLabel('saving', t) : getContactDetailActionLabel('save', t)}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {getContactDetailActionLabel('cancel', t)}
        </Button>
      </div>
    </form>
  );
}
