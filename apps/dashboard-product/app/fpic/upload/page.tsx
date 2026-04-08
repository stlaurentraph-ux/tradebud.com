'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UploadFPICPage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="Upload FPIC Evidence"
        subtitle="Submit consent and supporting documents for FPIC review"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'FPIC', href: '/fpic' },
          { label: 'Upload' },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/fpic">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to FPIC
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>FPIC Upload</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This route is active and ready for upload form wiring.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

