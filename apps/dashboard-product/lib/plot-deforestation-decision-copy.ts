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

const PLOT_DEFORESTATION_DECISION_COPY = {
  panel_title: {
    key: 'workflow.plot_deforestation.panel.title',
    fallback: 'Deforestation Decision History',
  },
  cutoff_aria_label: {
    key: 'workflow.plot_deforestation.panel.cutoff_aria',
    fallback: 'Deforestation cutoff date',
  },
  run_cta: {
    key: 'workflow.plot_deforestation.panel.run_cta',
    fallback: 'Run decision',
  },
  running: {
    key: 'workflow.plot_deforestation.panel.running',
    fallback: 'Running...',
  },
  retry: {
    key: 'workflow.plot_deforestation.panel.retry',
    fallback: 'Retry',
  },
  run_success: {
    key: 'workflow.plot_deforestation.panel.run_success',
    fallback: 'Decision run recorded for cutoff {date}.',
  },
  last_run_summary: {
    key: 'workflow.plot_deforestation.panel.last_run',
    fallback: 'Last run: cutoff {cutoff} | verdict {verdict} | provider mode {provider}',
  },
  loading_title: {
    key: 'workflow.plot_deforestation.panel.loading_title',
    fallback: 'Loading deforestation decisions...',
  },
  error_title: {
    key: 'workflow.plot_deforestation.panel.error_title',
    fallback: 'Deforestation decision history unavailable',
  },
  empty_title: {
    key: 'workflow.plot_deforestation.panel.empty_title',
    fallback: 'No decision events yet',
  },
  empty_description: {
    key: 'workflow.plot_deforestation.panel.empty_description',
    fallback: 'Run a cutoff-date deforestation decision to create immutable decision evidence.',
  },
  col_timestamp: {
    key: 'workflow.plot_deforestation.panel.col.timestamp',
    fallback: 'Timestamp',
  },
  col_cutoff: {
    key: 'workflow.plot_deforestation.panel.col.cutoff',
    fallback: 'Cutoff Date',
  },
  col_verdict: {
    key: 'workflow.plot_deforestation.panel.col.verdict',
    fallback: 'Verdict',
  },
  col_alerts: {
    key: 'workflow.plot_deforestation.panel.col.alerts',
    fallback: 'Alerts',
  },
  col_provider: {
    key: 'workflow.plot_deforestation.panel.col.provider',
    fallback: 'Provider Mode',
  },
  alerts_ha: {
    key: 'workflow.plot_deforestation.panel.alerts_ha',
    fallback: '{count} / {area} ha',
  },
  na: {
    key: 'workflow.plot_deforestation.panel.na',
    fallback: 'n/a',
  },
} as const;

const VERDICT_COPY = {
  no_deforestation_detected: {
    key: 'workflow.plot_deforestation.verdict.no_deforestation',
    fallback: 'No deforestation detected',
  },
  possible_deforestation_detected: {
    key: 'workflow.plot_deforestation.verdict.possible',
    fallback: 'Possible deforestation detected',
  },
  unknown: {
    key: 'workflow.plot_deforestation.verdict.unknown',
    fallback: 'Unknown',
  },
} as const;

export function getPlotDeforestationDecisionCopy(
  key: keyof typeof PLOT_DEFORESTATION_DECISION_COPY,
  t?: TranslateFn,
  vars?: Record<string, string | number>,
): string {
  const entry = PLOT_DEFORESTATION_DECISION_COPY[key];
  return wf(entry.key, entry.fallback, t, vars);
}

export function getPlotDeforestationVerdictLabel(
  verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown',
  t?: TranslateFn,
): string {
  const entry = VERDICT_COPY[verdict];
  return wf(entry.key, entry.fallback, t);
}

export function getPlotDeforestationDecisionCopyManifest(): Record<string, string> {
  return Object.fromEntries([
    ...Object.values(PLOT_DEFORESTATION_DECISION_COPY).map((entry) => [entry.key, entry.fallback]),
    ...Object.values(VERDICT_COPY).map((entry) => [entry.key, entry.fallback]),
  ]);
}
