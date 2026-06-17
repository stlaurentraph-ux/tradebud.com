import type { ContactActivityType, ProcessingFacilitySubtype } from '@/lib/contact-activity-types';
import type { ContactRecord } from '@/lib/contact-service';

export const UNASSIGNED_ORGANIZATION_KEY = '__unassigned__';

export interface SupplierOrganizationGroup {
  key: string;
  displayName: string;
  contacts: ContactRecord[];
  contact_type: ContactActivityType;
  processing_subtype: ProcessingFacilitySubtype | null;
  country: string | null;
}

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

export function pickOrganizationPrimaryContact(contacts: ContactRecord[]): ContactRecord {
  return [...contacts].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  )[0];
}

export function groupContactsByOrganization(contacts: ContactRecord[]): {
  organizations: SupplierOrganizationGroup[];
  unassigned: ContactRecord[];
} {
  const orgMap = new Map<string, SupplierOrganizationGroup>();
  const unassigned: ContactRecord[] = [];

  for (const contact of contacts) {
    const key = organizationDirectoryKey(contact.organization);
    if (!key) {
      unassigned.push(contact);
      continue;
    }
    const existing = orgMap.get(key);
    if (existing) {
      existing.contacts.push(contact);
      continue;
    }
    orgMap.set(key, {
      key,
      displayName: contact.organization!.trim(),
      contacts: [contact],
      contact_type: contact.contact_type,
      processing_subtype: contact.processing_subtype,
      country: contact.country,
    });
  }

  const organizations = [...orgMap.values()]
    .map((group) => {
      const primary = pickOrganizationPrimaryContact(group.contacts);
      return {
        ...group,
        contact_type: primary.contact_type,
        processing_subtype: primary.processing_subtype,
        country: primary.country,
        contacts: [...group.contacts].sort((left, right) =>
          left.full_name.localeCompare(right.full_name),
        ),
      };
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  unassigned.sort((left, right) => left.full_name.localeCompare(right.full_name));

  return { organizations, unassigned };
}

export function buildOrganizationHref(displayName: string): string {
  return `/contacts/organization?${new URLSearchParams({ organization: displayName }).toString()}`;
}

export function findOrganizationGroup(
  contacts: ContactRecord[],
  organizationName: string,
): SupplierOrganizationGroup | null {
  const key = organizationDirectoryKey(organizationName);
  if (!key) return null;
  const { organizations } = groupContactsByOrganization(contacts);
  return organizations.find((group) => group.key === key) ?? null;
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
