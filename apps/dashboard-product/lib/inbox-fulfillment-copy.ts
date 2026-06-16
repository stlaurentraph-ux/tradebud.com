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

const INBOX_FULFILLMENT_COPY = {
  dialog_title: {
    key: 'workflow.inbox.fulfillment.title',
    fallback: 'Fulfill request',
  },
  dialog_description: {
    key: 'workflow.inbox.fulfillment.description',
    fallback:
      'Attach shipment, plot, and evidence context for {title} from {org}. This marks the request as responded and updates the sender campaign.',
  },
  due_label: {
    key: 'workflow.inbox.fulfillment.due',
    fallback: 'Due {date}',
  },
  notes_label: {
    key: 'workflow.inbox.fulfillment.notes_label',
    fallback: 'Fulfillment notes',
  },
  notes_placeholder: {
    key: 'workflow.inbox.fulfillment.notes_placeholder',
    fallback: 'Describe what evidence or shipment context you are providing.',
  },
  shipment_label: {
    key: 'workflow.inbox.fulfillment.shipment_label',
    fallback: 'Link shipment (optional)',
  },
  shipment_none: {
    key: 'workflow.inbox.fulfillment.shipment_none',
    fallback: 'No shipment linked',
  },
  plot_evidence_label: {
    key: 'workflow.inbox.fulfillment.plot_evidence_label',
    fallback: 'Plot evidence',
  },
  selected_count: {
    key: 'workflow.inbox.fulfillment.selected_count',
    fallback: '{count} selected',
  },
  plots_loading: {
    key: 'workflow.inbox.fulfillment.plots_loading',
    fallback: 'Loading tenant plots...',
  },
  plots_empty: {
    key: 'workflow.inbox.fulfillment.plots_empty',
    fallback: 'No plots available for this tenant yet.',
  },
  plot_source_shipment: {
    key: 'workflow.inbox.fulfillment.plot_source_shipment',
    fallback: 'From linked shipment',
  },
  plot_source_tenant: {
    key: 'workflow.inbox.fulfillment.plot_source_tenant',
    fallback: 'Tenant plot',
  },
  evidence_repo_label: {
    key: 'workflow.inbox.fulfillment.evidence_repo_label',
    fallback: 'FPIC / evidence repository',
  },
  evidence_repo_link: {
    key: 'workflow.inbox.fulfillment.evidence_repo_link',
    fallback: 'Open evidence repository',
  },
  evidence_loading: {
    key: 'workflow.inbox.fulfillment.evidence_loading',
    fallback: 'Loading evidence feed...',
  },
  evidence_empty: {
    key: 'workflow.inbox.fulfillment.evidence_empty',
    fallback:
      'No synced evidence documents yet. Upload in the evidence repository, then return to fulfill this request.',
  },
  evidence_plot_ref: {
    key: 'workflow.inbox.fulfillment.evidence_plot_ref',
    fallback: 'plot {id}',
  },
  cancel: {
    key: 'workflow.inbox.fulfillment.cancel',
    fallback: 'Cancel',
  },
  submit: {
    key: 'workflow.inbox.fulfillment.submit',
    fallback: 'Submit fulfillment',
  },
  submitting: {
    key: 'workflow.inbox.fulfillment.submitting',
    fallback: 'Submitting...',
  },
} as const;

const EVIDENCE_STATUS_COPY = {
  verified: {
    key: 'workflow.inbox.fulfillment.evidence_status.verified',
    fallback: 'Verified',
  },
  pending_review: {
    key: 'workflow.inbox.fulfillment.evidence_status.pending_review',
    fallback: 'Pending review',
  },
  expired: {
    key: 'workflow.inbox.fulfillment.evidence_status.expired',
    fallback: 'Expired',
  },
  renewal_due: {
    key: 'workflow.inbox.fulfillment.evidence_status.renewal_due',
    fallback: 'Renewal due',
  },
} as const;

export function getInboxFulfillmentCopy(
  key: keyof typeof INBOX_FULFILLMENT_COPY,
  t?: TranslateFn,
  vars?: Record<string, string | number>,
): string {
  const entry = INBOX_FULFILLMENT_COPY[key];
  return wf(entry.key, entry.fallback, t, vars);
}

export function getInboxFulfillmentEvidenceStatusLabel(status: string, t?: TranslateFn): string {
  const entry = EVIDENCE_STATUS_COPY[status as keyof typeof EVIDENCE_STATUS_COPY];
  if (!entry) return status;
  return wf(entry.key, entry.fallback, t);
}

export function getInboxFulfillmentCopyManifest(): Record<string, string> {
  return Object.fromEntries([
    ...Object.values(INBOX_FULFILLMENT_COPY).map((entry) => [entry.key, entry.fallback]),
    ...Object.values(EVIDENCE_STATUS_COPY).map((entry) => [entry.key, entry.fallback]),
  ]);
}
