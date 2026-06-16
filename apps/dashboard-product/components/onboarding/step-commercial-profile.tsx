'use client';

import { useContext } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import {
  getSignupCopy,
  getSignupCommodityLabel,
  getSignupObjectiveLabel,
} from '@/lib/workflow-terminology-labels';

export interface CommercialProfileData {
  memberCount: string;
  supplierCount: string;
  importerCount: string;
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

const EUDR_COMMODITIES = ['coffee', 'cocoa', 'soy', 'cattle', 'oil_palm', 'rubber', 'wood'] as const;

const OBJECTIVES = [
  'eudr_compliance',
  'supply_chain_visibility',
  'dds_automation',
  'supplier_onboarding',
  'buyer_reporting',
] as const;

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Input
        id={id}
        type="number"
        min={1}
        placeholder={placeholder}
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
  t,
}: {
  role: PrimaryRole | '';
  data: CommercialProfileData;
  onChange: (d: CommercialProfileData) => void;
  disabled?: boolean;
  t?: (key: string) => string;
}) {
  const numberPlaceholder = getSignupCopy('number_placeholder', t);

  if (role === 'cooperative') {
    return (
      <NumberField
        id="memberCount"
        label={getSignupCopy('members_count', t)}
        hint={getSignupCopy('members_hint', t)}
        value={data.memberCount}
        onChange={(v) => onChange({ ...data, memberCount: v })}
        disabled={disabled}
        placeholder={numberPlaceholder}
      />
    );
  }

  if (role === 'exporter') {
    return (
      <div className="space-y-4">
        <NumberField
          id="supplierCount"
          label={getSignupCopy('suppliers_count', t)}
          hint={getSignupCopy('suppliers_hint_exporter', t)}
          value={data.supplierCount}
          onChange={(v) => onChange({ ...data, supplierCount: v })}
          disabled={disabled}
          placeholder={numberPlaceholder}
        />
        <NumberField
          id="importerCount"
          label={getSignupCopy('importers_count', t)}
          hint={getSignupCopy('importers_hint', t)}
          value={data.importerCount}
          onChange={(v) => onChange({ ...data, importerCount: v })}
          disabled={disabled}
          placeholder={numberPlaceholder}
        />
      </div>
    );
  }

  if (role === 'importer') {
    return (
      <NumberField
        id="supplierCount"
        label={getSignupCopy('suppliers_count', t)}
        hint={getSignupCopy('suppliers_hint_importer', t)}
        value={data.supplierCount}
        onChange={(v) => onChange({ ...data, supplierCount: v })}
        disabled={disabled}
        placeholder={numberPlaceholder}
      />
    );
  }

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <RoleSpecificFields role={role} data={data} onChange={onChange} disabled={isSubmitting} t={t} />

      <div className="space-y-2">
        <Label htmlFor="commodity">{getSignupCopy('field_primary_commodity', t)}</Label>
        <Select
          value={data.primaryCommodity}
          onValueChange={(val) => onChange({ ...data, primaryCommodity: val })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="commodity">
            <SelectValue placeholder={getSignupCopy('commodity_placeholder', t)} />
          </SelectTrigger>
          <SelectContent>
            {EUDR_COMMODITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {getSignupCommodityLabel(value, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">
          <Target className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          {getSignupCopy('field_primary_objective', t)}
        </Label>
        <Select
          value={data.primaryObjective}
          onValueChange={(val) => onChange({ ...data, primaryObjective: val })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="objective">
            <SelectValue placeholder={getSignupCopy('objective_placeholder', t)} />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIVES.map((value) => (
              <SelectItem key={value} value={value}>
                {getSignupObjectiveLabel(value, t)}
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
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isSubmitting}>
          {getSignupCopy('back', t)}
        </Button>
        <Button type="button" variant="ghost" className="flex-1 text-muted-foreground" onClick={onNext} disabled={isSubmitting}>
          {getSignupCopy('skip_for_now', t)}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {getSignupCopy('finishing', t)}
            </>
          ) : (
            getSignupCopy('go_to_dashboard', t)
          )}
        </Button>
      </div>
    </form>
  );
}
