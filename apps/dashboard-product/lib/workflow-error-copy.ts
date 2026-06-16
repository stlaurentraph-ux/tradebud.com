type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn): string {
  if (!t) return fallback;
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

const WORKFLOW_ERROR_COPY = {
  inbox_fulfillment_submit: {
    key: 'workflow.errors.inbox.fulfillment_submit',
    fallback: 'Failed to submit fulfillment.',
  },
  plot_deforestation_decision_run: {
    key: 'workflow.errors.plots.deforestation_decision_run',
    fallback: 'Failed to run deforestation decision.',
  },
  geometry_remediation_load: {
    key: 'workflow.errors.field_ops.geometry_remediation_load',
    fallback: 'Failed to load geometry remediation queue.',
  },
  evidence_open_file: {
    key: 'workflow.errors.evidence.open_file',
    fallback: 'Could not open file.',
  },
  evidence_download_file: {
    key: 'workflow.errors.evidence.download_file',
    fallback: 'Could not download file.',
  },
  billing_upgrade_failed: {
    key: 'workflow.errors.billing.upgrade_failed',
    fallback: 'Upgrade failed.',
  },
} as const;

export function getWorkflowErrorCopy(
  key: keyof typeof WORKFLOW_ERROR_COPY,
  t?: TranslateFn,
): string {
  const entry = WORKFLOW_ERROR_COPY[key];
  return wf(entry.key, entry.fallback, t);
}

export function getWorkflowErrorCopyManifest(): Record<string, string> {
  return Object.fromEntries(Object.values(WORKFLOW_ERROR_COPY).map((entry) => [entry.key, entry.fallback]));
}

/** Prefer API message when present; otherwise localized fallback. */
export function resolveWorkflowErrorMessage(
  error: unknown,
  fallbackKey: keyof typeof WORKFLOW_ERROR_COPY,
  t?: TranslateFn,
): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return getWorkflowErrorCopy(fallbackKey, t);
}
