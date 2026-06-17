'use client';

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LocaleContext } from '@/lib/locale-context';
import { buildOrganizationHref, groupContactsByOrganization } from '@/lib/contact-directory';
import type { ContactRecord, ContactStatus } from '@/lib/contact-service';
import type { User } from '@/types';
import {
  getContactActivityDisplayLabel,
  getContactStatusLabel,
  getContactsOrgCopy,
  getContactsTableColumnLabel,
  getProducerDetailHref,
} from '@/lib/workflow-terminology-labels';

interface SupplierOrganizationListProps {
  contacts: ContactRecord[];
  role?: User['active_role'];
}

function statusBadgeVariant(
  status: ContactStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'blocked') return 'destructive';
  if (status === 'inactive') return 'secondary';
  if (['invited', 'engaged', 'submitted'].includes(status)) return 'default';
  return 'outline';
}

export function SupplierOrganizationList({ contacts, role }: SupplierOrganizationListProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { organizations, unassigned } = useMemo(() => groupContactsByOrganization(contacts), [contacts]);

  if (organizations.length === 0 && unassigned.length === 0) {
    return <p className="text-sm text-muted-foreground">{getContactsOrgCopy('empty', t)}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="w-[28%] px-3 py-2.5 font-medium">
              {getContactsTableColumnLabel('organization', t)}
            </th>
            <th className="w-[22%] px-3 py-2.5 font-medium">
              {getContactsOrgCopy('column_person', t)}
            </th>
            <th className="px-3 py-2.5 font-medium">{getContactsTableColumnLabel('email', t)}</th>
            <th className="w-[120px] px-3 py-2.5 font-medium">
              {getContactsTableColumnLabel('status', t)}
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((group, groupIndex) =>
            group.contacts.map((contact, personIndex) => (
              <tr
                key={contact.id}
                className={[
                  'border-t border-border/70 transition-colors hover:bg-muted/35',
                  groupIndex > 0 && personIndex === 0 ? 'border-t-2' : '',
                  personIndex > 0 ? 'bg-muted/15' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {personIndex === 0 ? (
                  <td
                    rowSpan={group.contacts.length}
                    className="border-r border-border/50 bg-muted/20 px-3 py-3 align-top"
                  >
                    <Link
                      href={buildOrganizationHref(group.displayName)}
                      className="group block space-y-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-foreground group-hover:text-primary group-hover:underline">
                          {group.displayName}
                        </span>
                        {group.contacts.length > 1 ? (
                          <span className="text-xs font-normal text-muted-foreground">
                            {getContactsOrgCopy('people_count', t, { count: group.contacts.length })}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {getContactActivityDisplayLabel(
                            {
                              contact_type: group.contact_type,
                              processing_subtype: group.processing_subtype,
                            },
                            t,
                          )}
                        </Badge>
                        {group.country ? (
                          <span className="text-xs text-muted-foreground">{group.country}</span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                ) : null}
                <td className={`px-3 py-2.5 ${personIndex > 0 ? 'border-l-2 border-l-primary/15 pl-4' : ''}`}>
                  <Link
                    href={getProducerDetailHref(contact.id, role, contact.contact_type)}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {contact.full_name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{contact.email}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={statusBadgeVariant(contact.status)}>
                    {getContactStatusLabel(contact.status, t)}
                  </Badge>
                </td>
              </tr>
            )),
          )}

          {unassigned.length > 0 ? (
            <>
              <tr className="border-t-2 bg-muted/30">
                <td colSpan={4} className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  {getContactsOrgCopy('unassigned_title', t)}
                </td>
              </tr>
              {unassigned.map((contact) => (
                <tr key={contact.id} className="border-t border-border/70 hover:bg-muted/35">
                  <td className="border-r border-border/50 px-3 py-2.5 text-muted-foreground">—</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={getProducerDetailHref(contact.id, role, contact.contact_type)}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {contact.full_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{contact.email}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={statusBadgeVariant(contact.status)}>
                      {getContactStatusLabel(contact.status, t)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
