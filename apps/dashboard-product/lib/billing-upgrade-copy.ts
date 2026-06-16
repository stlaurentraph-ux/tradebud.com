type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn, vars?: Record<string, string | number>): string {
  let text = fallback;
  if (t) {
    const resolved = t(key);
    text = resolved === key ? fallback : resolved;
  }
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}

const BILLING_UPGRADE_COPY = {
  dialog_title: {
    key: 'workflow.billing.upgrade.title',
    fallback: 'Confirm subscription band upgrade',
  },
  dialog_description: {
    key: 'workflow.billing.upgrade.description',
    fallback:
      'Your managed contact count requires a higher subscription band. Billing updates on the first day of next month; you can add contacts immediately after accepting.',
  },
  current_band_label: {
    key: 'workflow.billing.upgrade.current_band',
    fallback: 'Current band:',
  },
  new_band_label: {
    key: 'workflow.billing.upgrade.new_band',
    fallback: 'New band:',
  },
  price_from_next_month: {
    key: 'workflow.billing.upgrade.price_from_next_month',
    fallback: '· €{price}/mo from next month',
  },
  managed_contacts: {
    key: 'workflow.billing.upgrade.managed_contacts',
    fallback: 'Managed contacts: {count}',
  },
  managed_contacts_ceiling: {
    key: 'workflow.billing.upgrade.managed_contacts_ceiling',
    fallback: ' / {ceiling}',
  },
  consent_checkbox: {
    key: 'workflow.billing.upgrade.consent_checkbox',
    fallback:
      'I understand my subscription will move to the {band} band and the new monthly price applies from the next calendar month.',
  },
  cancel: {
    key: 'workflow.billing.upgrade.cancel',
    fallback: 'Cancel',
  },
  accept: {
    key: 'workflow.billing.upgrade.accept',
    fallback: 'Accept upgrade',
  },
  saving: {
    key: 'workflow.billing.upgrade.saving',
    fallback: 'Saving…',
  },
} as const;

export function getBillingUpgradeCopy(
  key: keyof typeof BILLING_UPGRADE_COPY,
  t?: TranslateFn,
  vars?: Record<string, string | number>,
): string {
  const entry = BILLING_UPGRADE_COPY[key];
  return wf(entry.key, entry.fallback, t, vars);
}

export function getBillingUpgradeCopyManifest(): Record<string, string> {
  return Object.fromEntries(Object.values(BILLING_UPGRADE_COPY).map((entry) => [entry.key, entry.fallback]));
}
