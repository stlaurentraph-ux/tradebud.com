import type { User } from '@/types';

type SupplyChainRole = User['active_role'] | null | undefined;
type TranslateFn = (key: string) => string;

function wf(
  key: string,
  fallback: string,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  if (!t) {
    const text = fallback;
    if (!values) return text;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
      text,
    );
  }
  const resolved = t(key);
  const text = resolved === key ? fallback : resolved;
  if (!values) return text;
  return Object.entries(values).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    text,
  );
}

const PLOT_CREATE_COPY = {
  guidance_title: {
    key: 'workflow.plots.guidance.title',
    fallback: 'How plots appear in your workspace',
  },
  guidance_recommended_cooperative: {
    key: 'workflow.plots.guidance.recommended.cooperative',
    fallback:
      'Missing plot geometry, area, or member details? Launch a campaign to request data from your members. When the request reaches them, they map plots in the field app and grant data access — plots then appear here automatically.',
  },
  guidance_recommended_default: {
    key: 'workflow.plots.guidance.recommended.default',
    fallback:
      'Missing plot geometry, area, or producer details? Launch a campaign to request data from your contacts. When the request reaches the source, producers map plots in the field app and grant data access — plots then appear here automatically.',
  },
  guidance_manual_cooperative: {
    key: 'workflow.plots.guidance.manual.cooperative',
    fallback:
      'Only use manual registration when you already have complete plot details (member, area, and coordinates) and permission to register on their behalf.',
  },
  guidance_manual_default: {
    key: 'workflow.plots.guidance.manual.default',
    fallback:
      'Only use manual registration when you already have complete plot details (producer, area, and coordinates) and permission to register on their behalf.',
  },
  guidance_request_cta: {
    key: 'workflow.plots.guidance.request_cta',
    fallback: 'Launch data request',
  },
  create_cta: {
    key: 'workflow.plots.cta.register_manual',
    fallback: 'Register plot manually',
  },
  create_dialog_title: {
    key: 'workflow.plots.create.dialog.title',
    fallback: 'Register plot manually',
  },
  create_dialog_intro_cooperative: {
    key: 'workflow.plots.create.dialog.intro.cooperative',
    fallback:
      'Use this form only when you already hold verified plot details for a member. If anything is missing, launch a data request first — mapped plots sync here after they grant access.',
  },
  create_dialog_intro_default: {
    key: 'workflow.plots.create.dialog.intro.default',
    fallback:
      'Use this form only when you already hold verified plot details for a producer. If anything is missing, launch a data request first — mapped plots sync here after they grant access.',
  },
  create_dialog_form_heading: {
    key: 'workflow.plots.create.dialog.form_heading',
    fallback: 'Plot details you already have',
  },
  create_dialog_producer_label_cooperative: {
    key: 'workflow.plots.create.dialog.producer_label.cooperative',
    fallback: 'Member',
  },
  create_dialog_producer_label_default: {
    key: 'workflow.plots.create.dialog.producer_label.default',
    fallback: 'Producer',
  },
  create_dialog_producer_select_cooperative: {
    key: 'workflow.plots.create.dialog.producer_select.cooperative',
    fallback: 'Select from members (optional)',
  },
  create_dialog_producer_select_default: {
    key: 'workflow.plots.create.dialog.producer_select.default',
    fallback: 'Select from producers (optional)',
  },
  create_dialog_producer_pending_suffix: {
    key: 'workflow.plots.create.dialog.producer_pending_suffix',
    fallback: ' — not mapped in field yet',
  },
  create_dialog_producer_hint_cooperative: {
    key: 'workflow.plots.create.dialog.producer_hint.cooperative',
    fallback:
      'Choose the member this plot belongs to. Pick them from your directory, or create a new reference if you added them manually and they have not mapped in the field app yet.',
  },
  create_dialog_producer_hint_default: {
    key: 'workflow.plots.create.dialog.producer_hint.default',
    fallback:
      'Choose the producer this plot belongs to. Pick them from your directory, or create a new reference if you added them manually and they have not mapped in the field app yet.',
  },
  create_dialog_producer_generate_cooperative: {
    key: 'workflow.plots.create.dialog.producer_generate.cooperative',
    fallback: 'New member reference',
  },
  create_dialog_producer_generate_default: {
    key: 'workflow.plots.create.dialog.producer_generate.default',
    fallback: 'New producer reference',
  },
  create_success_toast: {
    key: 'workflow.plots.create.success_toast',
    fallback: 'Plot registered and added to your inventory.',
  },
  empty_guidance_cooperative: {
    key: 'workflow.plots.empty.guidance.cooperative',
    fallback:
      'No plots yet. Request missing field data from members — plots appear here automatically after they map boundaries and grant access.',
  },
  empty_guidance_default: {
    key: 'workflow.plots.empty.guidance.default',
    fallback:
      'No plots yet. Request missing field data from your contacts — plots appear here automatically after producers map boundaries and grant access.',
  },
} as const;

export function getPlotsGuidanceTitle(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.guidance_title.key, PLOT_CREATE_COPY.guidance_title.fallback, t);
}

export function getPlotsGuidanceRecommendedBody(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative'
      ? PLOT_CREATE_COPY.guidance_recommended_cooperative
      : PLOT_CREATE_COPY.guidance_recommended_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsGuidanceManualBody(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative' ? PLOT_CREATE_COPY.guidance_manual_cooperative : PLOT_CREATE_COPY.guidance_manual_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsRequestCtaLabel(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.guidance_request_cta.key, PLOT_CREATE_COPY.guidance_request_cta.fallback, t);
}

export function getPlotsRegisterManualCtaLabel(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.create_cta.key, PLOT_CREATE_COPY.create_cta.fallback, t);
}

export function getPlotsCreateDialogTitle(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.create_dialog_title.key, PLOT_CREATE_COPY.create_dialog_title.fallback, t);
}

export function getPlotsCreateDialogIntro(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative' ? PLOT_CREATE_COPY.create_dialog_intro_cooperative : PLOT_CREATE_COPY.create_dialog_intro_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsCreateDialogFormHeading(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.create_dialog_form_heading.key, PLOT_CREATE_COPY.create_dialog_form_heading.fallback, t);
}

export function getPlotsCreateDialogProducerHint(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative'
      ? PLOT_CREATE_COPY.create_dialog_producer_hint_cooperative
      : PLOT_CREATE_COPY.create_dialog_producer_hint_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsCreateDialogProducerLabel(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative'
      ? PLOT_CREATE_COPY.create_dialog_producer_label_cooperative
      : PLOT_CREATE_COPY.create_dialog_producer_label_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsCreateDialogProducerSelectPlaceholder(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative'
      ? PLOT_CREATE_COPY.create_dialog_producer_select_cooperative
      : PLOT_CREATE_COPY.create_dialog_producer_select_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsCreateDialogProducerPendingSuffix(t?: TranslateFn): string {
  return wf(
    PLOT_CREATE_COPY.create_dialog_producer_pending_suffix.key,
    PLOT_CREATE_COPY.create_dialog_producer_pending_suffix.fallback,
    t,
  );
}

export function getPlotsCreateDialogProducerGenerateLabel(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative'
      ? PLOT_CREATE_COPY.create_dialog_producer_generate_cooperative
      : PLOT_CREATE_COPY.create_dialog_producer_generate_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotsCreateSuccessToast(t?: TranslateFn): string {
  return wf(PLOT_CREATE_COPY.create_success_toast.key, PLOT_CREATE_COPY.create_success_toast.fallback, t);
}

export function getPlotsEmptyGuidanceMessage(role: SupplyChainRole, t?: TranslateFn): string {
  const entry =
    role === 'cooperative' ? PLOT_CREATE_COPY.empty_guidance_cooperative : PLOT_CREATE_COPY.empty_guidance_default;
  return wf(entry.key, entry.fallback, t);
}

export function getPlotCreateCopyManifest(): Record<string, string> {
  return Object.fromEntries(
    Object.values(PLOT_CREATE_COPY).map((entry) => [entry.key, entry.fallback]),
  );
}

export const PLOTS_DATA_REQUEST_HREF = '/outreach?new=1';
