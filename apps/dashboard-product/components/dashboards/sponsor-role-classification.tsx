'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NetworkRoleRow } from '@/lib/sponsor-network-aggregates';

interface SponsorRoleClassificationProps {
  roles: NetworkRoleRow[];
  inviteHref: string;
}

export function SponsorRoleClassification({ roles, inviteHref }: SponsorRoleClassificationProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Supply chain roles</CardTitle>
          <CardDescription>
            Classify cooperatives, exporters, importers, producers, and partners to reach end-to-end transparency.
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href={inviteHref}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Invite & classify
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No classified network members yet. Invite contacts and register organisations with their supply chain role.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <div key={role.roleKey} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{role.label}</p>
                  <Badge variant="outline">{role.organisationCount + role.contactCount}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {role.organisationCount} organisations · {role.contactCount} contacts
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
