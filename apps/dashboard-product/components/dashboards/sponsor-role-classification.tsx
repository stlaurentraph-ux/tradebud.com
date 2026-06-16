'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NetworkRoleRow } from '@/lib/sponsor-network-aggregates';
import { LocaleContext } from '@/lib/locale-context';
import { getSponsorPanelCopy } from '@/lib/workflow-terminology-labels';

interface SponsorRoleClassificationProps {
  roles: NetworkRoleRow[];
  inviteHref: string;
}

export function SponsorRoleClassification({ roles, inviteHref }: SponsorRoleClassificationProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{getSponsorPanelCopy('roles_title', t)}</CardTitle>
          <CardDescription>{getSponsorPanelCopy('roles_description', t)}</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href={inviteHref}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {getSponsorPanelCopy('roles_invite', t)}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{getSponsorPanelCopy('roles_empty', t)}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <div key={role.roleKey} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{role.label}</p>
                  <Badge variant="outline">{role.organisationCount + role.contactCount}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {getSponsorPanelCopy('roles_row', t, {
                    orgs: role.organisationCount,
                    contacts: role.contactCount,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
