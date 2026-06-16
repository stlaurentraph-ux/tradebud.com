'use client';

import { useContext } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  SUPPLY_CHAIN_ROLE_OPTIONS,
  SUPPLY_CHAIN_ROLE_PRESETS,
  toggleSupplyChainRoleSelection,
  type SupplyChainRoleId,
  type SupplyChainRolePresetId,
} from '@/lib/org-supply-chain-roles';
import { cn } from '@/lib/utils';
import { LocaleContext } from '@/lib/locale-context';
import {
  getSettingsCopy,
  getSupplyChainRoleMixDescription,
  getSupplyChainRoleOptionDescription,
  getSupplyChainRoleOptionLabel,
  getSupplyChainRolePresetLabel,
} from '@/lib/workflow-terminology-labels';

interface SupplyChainRolePickerProps {
  selected: SupplyChainRoleId[];
  onChange: (roles: SupplyChainRoleId[]) => void;
  disabled?: boolean;
  showPresets?: boolean;
}

export function SupplyChainRolePicker({
  selected,
  onChange,
  disabled = false,
  showPresets = true,
}: SupplyChainRolePickerProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const mixDescription = getSupplyChainRoleMixDescription(selected, t);
  const activePresetId = SUPPLY_CHAIN_ROLE_PRESETS.find(
    (preset) =>
      preset.roles.length === selected.length && preset.roles.every((role) => selected.includes(role)),
  )?.id;

  const applyPreset = (presetId: SupplyChainRolePresetId) => {
    const preset = SUPPLY_CHAIN_ROLE_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    onChange([...preset.roles]);
  };

  return (
    <div className="space-y-4">
      {showPresets ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{getSettingsCopy('supply_chain_common_setups', t)}</p>
          <div className="flex flex-wrap gap-2">
            {SUPPLY_CHAIN_ROLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-left text-xs transition-colors',
                  activePresetId === preset.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'hover:bg-muted/50',
                )}
              >
                <span className="font-medium">{getSupplyChainRolePresetLabel(preset.id, t)}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{getSettingsCopy('supply_chain_presets_hint', t)}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">{getSettingsCopy('supply_chain_roles', t)}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {SUPPLY_CHAIN_ROLE_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(toggleSupplyChainRoleSelection(selected, option.id))}
                className={cn(
                  'rounded-lg border p-4 text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted/50',
                  disabled && 'pointer-events-none opacity-60',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{getSupplyChainRoleOptionLabel(option.id, t)}</span>
                  {isSelected ? <Badge>{getSettingsCopy('supply_chain_enabled', t)}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getSupplyChainRoleOptionDescription(option.id, t)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{mixDescription}</p>
    </div>
  );
}
