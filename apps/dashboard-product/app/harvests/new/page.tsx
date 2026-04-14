'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewHarvestPage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="Record Harvest"
        subtitle="Create a new harvest record for producer and supplier workflows"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Harvests', href: '/harvests' },
          { label: 'New' },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/harvests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Harvests
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Harvest Intake Form</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is now routed and ready for the next implementation pass.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

