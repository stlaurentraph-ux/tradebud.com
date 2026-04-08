'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewDDSPage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="New DDS Package"
        subtitle="Create a new deforestation due diligence package"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Workspace', href: '/dds' },
          { label: 'New' },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to DDS Workspace
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>DDS Creation Form</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This route is now live and ready for form implementation.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

