import type { ContactRecord } from '@/lib/contact-service';

export function organizationDirectoryKey(organization: string | null | undefined): string | null {
  const trimmed = organization?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export function listOrganizationColleagues(
  contacts: ContactRecord[],
  contact: ContactRecord,
): ContactRecord[] {
  const key = organizationDirectoryKey(contact.organization);
  if (!key) return [];
  return contacts.filter(
    (item) => item.id !== contact.id && organizationDirectoryKey(item.organization) === key,
  );
}

export function buildAddColleagueHref(
  contact: Pick<ContactRecord, 'organization' | 'contact_type' | 'processing_subtype' | 'country'>,
): string {
  const params = new URLSearchParams({ mode: 'contact' });
  if (contact.organization?.trim()) {
    params.set('organization', contact.organization.trim());
  }
  params.set('contact_type', contact.contact_type);
  if (contact.processing_subtype) {
    params.set('processing_subtype', contact.processing_subtype);
  }
  if (contact.country?.trim()) {
    params.set('country', contact.country.trim());
  }
  return `/contacts/add?${params.toString()}`;
}
