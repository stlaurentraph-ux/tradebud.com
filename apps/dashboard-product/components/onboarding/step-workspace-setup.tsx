'use client';

import { Loader2, AlertCircle, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PrimaryRole =
  | 'importer'
  | 'exporter'
  | 'cooperative'
  | 'compliance_manager'
  | 'admin';

export interface WorkspaceSetupData {
  organizationName: string;
  country: string;
  primaryRole: PrimaryRole | '';
}

interface StepWorkspaceSetupProps {
  data: WorkspaceSetupData;
  onChange: (data: WorkspaceSetupData) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const ROLE_OPTIONS: { value: PrimaryRole; label: string; description: string }[] = [
  {
    value: 'importer',
    label: 'Importer',
    description: 'EU-based company bringing goods into the EU market',
  },
  {
    value: 'exporter',
    label: 'Exporter',
    description: 'Producer-country entity shipping goods to EU buyers',
  },
  {
    value: 'cooperative',
    label: 'Supplier / Cooperative',
    description: 'Producer cooperative or aggregator managing upstream supply data',
  },
  {
    value: 'compliance_manager',
    label: 'Compliance Manager',
    description: 'Internal or external compliance professional',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Platform or tenant administrator',
  },
];

// ISO-3166 country list (abbreviated — most relevant EUDR countries)
const COUNTRIES = [
  'Austria', 'Belgium', 'Bolivia', 'Brazil', 'Cambodia', 'Cameroon', 'Colombia',
  'Costa Rica', 'Côte d\'Ivoire', 'Czech Republic', 'Denmark', 'Ecuador',
  'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana', 'Guatemala', 'Honduras',
  'Hungary', 'India', 'Indonesia', 'Italy', 'Kenya', 'Laos', 'Malaysia',
  'Mexico', 'Myanmar', 'Netherlands', 'Nigeria', 'Norway', 'Papua New Guinea',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Rwanda', 'Spain',
  'Sweden', 'Tanzania', 'Thailand', 'Uganda', 'United Kingdom', 'United States',
  'Vietnam', 'Zimbabwe',
];

export function StepWorkspaceSetup({
  data,
  onChange,
  onNext,
  onBack,
  isSubmitting,
  error,
}: StepWorkspaceSetupProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext();
  };

  const isValid =
    data.organizationName.trim().length > 0 &&
    data.country.length > 0 &&
    data.primaryRole.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="orgName">
          <Building2 className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Organization name
        </Label>
        <Input
          id="orgName"
          type="text"
          placeholder="Acme Coffee Exports Ltd."
          value={data.organizationName}
          onChange={(e) => onChange({ ...data, organizationName: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">
          <Globe className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Country
        </Label>
        <Select
          value={data.country}
          onValueChange={(val) => onChange({ ...data, country: val })}
          disabled={isSubmitting}
          required
        >
          <SelectTrigger id="country">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Primary role</Label>
        <div className="grid gap-2 sm:grid-cols-1">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              type="button"
              disabled={isSubmitting}
              onClick={() => onChange({ ...data, primaryRole: role.value })}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                data.primaryRole === role.value
                  ? 'border-primary bg-secondary text-foreground'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
              aria-pressed={data.primaryRole === role.value}
            >
              <div
                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                  data.primaryRole === role.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground bg-transparent'
                }`}
              />
              <div>
                <div className="text-sm font-medium leading-none">{role.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{role.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </form>
  );
}
