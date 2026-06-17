'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import {
  getPackageDetailBackLabel,
  getPackageNotFoundMessage,
} from '@/lib/workflow-terminology-labels';

interface PackageNotFoundProps {
  role: User['active_role'] | undefined;
  t?: (key: string) => string;
}

export function PackageNotFound({ role, t }: PackageNotFoundProps) {
  return (
    <Card>
      <CardContent className="space-y-4 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">{getPackageNotFoundMessage(role, t)}</p>
        <p className="text-sm text-muted-foreground">
          The reference may be outdated or you may not have access to this record.
        </p>
        <Button variant="outline" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {getPackageDetailBackLabel(role, t)}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
