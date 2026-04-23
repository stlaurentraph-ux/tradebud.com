'use client';

import { Loader2, AlertCircle, Target } from 'lucide-react';
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
import type { PrimaryRole } from './step-workspace-setup';

export interface CommercialProfileData {
  // Cooperative-specific
  memberCount: string;
  // Exporter-specific
  supplierCount: string;
  importerCount: string;
  // Importer-specific (supplierCount shared)
  // Shared
  primaryCommodity: string;
  primaryObjective: string;
}

interface StepCommercialProfileProps {
  role: PrimaryRole | '';
  data: CommercialProfileData;
  onChange: (data: CommercialProfileData) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const EUDR_COMMODITIES = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'soy', label: 'Soy' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'oil_palm', label: 'Oil Palm' },
  { value: 'rubber', label: 'Rubber' },
  { value: 'wood', label: 'Wood' },
];

const OBJECTIVES: { value: string; label: string }[] = [
  { value: 'eudr_compliance', label: 'Achieve full EUDR compliance' },
  { value: 'supply_chain_visibility', label: 'Gain end-to-end supply chain visibility' },
  { value: 'dds_automation', label: 'Automate Due Diligence Statements (DDS)' },
  { value: 'supplier_onboarding', label: 'Onboard and manage suppliers' },
  { value: 'buyer_reporting', label: 'Report compliance data to EU buyers' },
];

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Input
        id={id}
        type="number"
        min={1}
        placeholder="e.g. 50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function RoleSpecificFields({
  role,
  data,
  onChange,
  disabled,
}: {
  role: PrimaryRole | '';
  data: CommercialProfileData;
  onChange: (d: CommercialProfileData) => void;
  disabled?: boolean;
}) {
  if (role === 'cooperative') {
    return (
      <NumberField
        id="memberCount"
        label="Number of members"
        hint="Farmer or producer members in your cooperative."
        value={data.memberCount}
        onChange={(v) => onChange({ ...data, memberCount: v })}
        disabled={disabled}
      />
    );
  }

  if (role === 'exporter') {
    return (
      <div className="space-y-4">
        <NumberField
          id="supplierCount"
          label="Number of suppliers"
          hint="Farms, cooperatives, or aggregators you source from."
          value={data.supplierCount}
          onChange={(v) => onChange({ ...data, supplierCount: v })}
          disabled={disabled}
        />
        <NumberField
          id="importerCount"
          label="Number of importers"
          hint="EU buyers you ship to."
          value={data.importerCount}
          onChange={(v) => onChange({ ...data, importerCount: v })}
          disabled={disabled}
        />
      </div>
    );
  }

  if (role === 'importer') {
    return (
      <NumberField
        id="supplierCount"
        label="Number of suppliers"
        hint="Exporters or producers you source from."
        value={data.supplierCount}
        onChange={(v) => onChange({ ...data, supplierCount: v })}
        disabled={disabled}
      />
    );
  }

  // compliance_manager, admin: no role-specific count fields
  return null;
}

export function StepCommercialProfile({
  role,
  data,
  onChange,
  onNext,
  onBack,
  isSubmitting,
  error,
}: StepCommercialProfileProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <RoleSpecificFields role={role} data={data} onChange={onChange} disabled={isSubmitting} />

      <div className="space-y-2">
        <Label htmlFor="commodity">Primary commodity</Label>
        <Select
          value={data.primaryCommodity}
          onValueChange={(val) => onChange({ ...data, primaryCommodity: val })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="commodity">
            <SelectValue placeholder="Select a commodity" />
          </SelectTrigger>
          <SelectContent>
            {EUDR_COMMODITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">
          <Target className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          Primary objective
        </Label>
        <Select
          value={data.primaryObjective}
          onValueChange={(val) => onChange({ ...data, primaryObjective: val })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="objective">
            <SelectValue placeholder="What brings you to Tracebud?" />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIVES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          type="button"
          variant="ghost"
          className="flex-1 text-muted-foreground"
          onClick={onNext}
          disabled={isSubmitting}
        >
          Skip for now
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finishing…
            </>
          ) : (
            'Go to dashboard'
          )}
        </Button>
      </div>
    </form>
  );
}
