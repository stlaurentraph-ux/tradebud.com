'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function NewPackagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    season: 'A',
    year: new Date().getFullYear(),
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock package code
    const packageCode = `DDS-${formData.year}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    // In a real app, this would create the package via API
    // For now, redirect to packages list
    router.push('/packages');
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Create New Package"
        subtitle="Start a new DDS package for EUDR compliance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Packages', href: '/packages' },
          { label: 'New Package' },
        ]}
      />

      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Link>
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Package Information</CardTitle>
                  <CardDescription>
                    Enter the basic details for this DDS package
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="supplier_name" className="text-sm font-medium">
                      Supplier / Cooperative Name *
                    </label>
                    <Input
                      id="supplier_name"
                      placeholder="e.g., Rwanda Coffee Cooperative"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      className="bg-secondary"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The name of the supplier or cooperative this package is for
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="season" className="text-sm font-medium">
                        Season *
                      </label>
                      <select
                        id="season"
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-secondary px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      >
                        <option value="A">Season A (Jan-Jun)</option>
                        <option value="B">Season B (Jul-Dec)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="year" className="text-sm font-medium">
                        Year *
                      </label>
                      <Input
                        id="year"
                        type="number"
                        min={2020}
                        max={2030}
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="bg-secondary"
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Any additional notes about this package..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="flex min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Plots Section */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Plots</CardTitle>
                  <CardDescription>
                    You can add plots after creating the package
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
                    <Plus className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Plots will be added after package creation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can link existing plots or create new ones
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Package Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Package Code</p>
                    <p className="text-sm font-mono text-foreground">
                      DDS-{formData.year}-XXX
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="text-sm text-foreground">
                      {formData.supplier_name || 'Not specified'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Season / Year</p>
                    <p className="text-sm text-foreground">
                      Season {formData.season} {formData.year}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Initial Status</p>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Draft
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting || !formData.supplier_name}>
                    {isSubmitting ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Package
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/packages">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
