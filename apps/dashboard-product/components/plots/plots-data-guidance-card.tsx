'use client';

import Link from 'next/link';
import { Info, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import {
  getPlotsGuidanceManualBody,
  getPlotsGuidanceRecommendedBody,
  getPlotsGuidanceTitle,
  getPlotsRequestCtaLabel,
  PLOTS_DATA_REQUEST_HREF,
} from '@/lib/plot-create-copy';

interface PlotsDataGuidanceCardProps {
  role?: User['active_role'];
  t?: (key: string) => string;
}

export function PlotsDataGuidanceCard({ role, t }: PlotsDataGuidanceCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-blue-700" aria-hidden="true" />
          {getPlotsGuidanceTitle(t)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        <p>{getPlotsGuidanceRecommendedBody(role, t)}</p>
        <p className="text-muted-foreground">{getPlotsGuidanceManualBody(role, t)}</p>
        <Button asChild size="sm" variant="outline" className="bg-white">
          <Link href={PLOTS_DATA_REQUEST_HREF}>
            <Send className="mr-2 h-4 w-4" />
            {getPlotsRequestCtaLabel(t)}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
