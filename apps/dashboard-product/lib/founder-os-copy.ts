type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn, values?: Record<string, string | number>): string {
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

const FOUNDER_OS_COPY = {
  page_title: { key: 'workflow.founder_os.page_title', fallback: 'Today' },
  page_subtitle: {
    key: 'workflow.founder_os.page_subtitle',
    fallback: 'Operate on two hard targets: 3 outreaches per weekday and 2 posts per week.',
  },
  loading_title: {
    key: 'workflow.founder_os.loading_title',
    fallback: 'Loading daily operating context...',
  },
  error_title: { key: 'workflow.founder_os.error_title', fallback: 'Failed to load operating context' },
  stat_outreach_today: { key: 'workflow.founder_os.stat.outreach_today', fallback: 'Outreach today' },
  stat_posts_week: { key: 'workflow.founder_os.stat.posts_week', fallback: 'Posts this week' },
  stat_exchanges_week: { key: 'workflow.founder_os.stat.exchanges_week', fallback: 'Exchanges this week' },
  stat_open_actions: { key: 'workflow.founder_os.stat.open_actions', fallback: 'Open outreach actions' },
  auto_plan_title: { key: 'workflow.founder_os.auto_plan.title', fallback: 'Auto-plan' },
  auto_plan_description: {
    key: 'workflow.founder_os.auto_plan.description',
    fallback: 'Fill your weekly operating targets automatically.',
  },
  plan_outreach: { key: 'workflow.founder_os.auto_plan.plan_outreach', fallback: 'Plan 3 outreach today' },
  plan_outreach_loading: { key: 'workflow.founder_os.auto_plan.plan_outreach_loading', fallback: 'Planning...' },
  plan_posts: { key: 'workflow.founder_os.auto_plan.plan_posts', fallback: 'Plan 2 posts this week' },
  plan_posts_loading: { key: 'workflow.founder_os.auto_plan.plan_posts_loading', fallback: 'Planning...' },
  outreach_streak: {
    key: 'workflow.founder_os.streak.outreach',
    fallback: 'Outreach streak: {{count}} weekday(s)',
  },
  publishing_streak: {
    key: 'workflow.founder_os.streak.publishing',
    fallback: 'Publishing streak: {{count}} week(s)',
  },
  open_outreach_queue: {
    key: 'workflow.founder_os.cta.open_outreach_queue',
    fallback: 'Open outreach queue',
  },
  open_content_board: { key: 'workflow.founder_os.cta.open_content_board', fallback: 'Open content board' },
  next_actions_title: {
    key: 'workflow.founder_os.next_actions.title',
    fallback: 'Next best outreach actions',
  },
  next_actions_empty: {
    key: 'workflow.founder_os.next_actions.empty',
    fallback: 'No pending outreach. You are clear.',
  },
  unknown_prospect: { key: 'workflow.founder_os.unknown_prospect', fallback: 'Unknown prospect' },
  outreach_added: {
    key: 'workflow.founder_os.toast.outreach_added',
    fallback: 'Added {{count}} outreach action(s).',
  },
  outreach_not_needed: {
    key: 'workflow.founder_os.toast.outreach_not_needed',
    fallback: 'No new outreach actions needed.',
  },
  outreach_plan_failed: {
    key: 'workflow.founder_os.toast.outreach_plan_failed',
    fallback: 'Failed to plan outreach actions.',
  },
  posts_added: {
    key: 'workflow.founder_os.toast.posts_added',
    fallback: 'Added {{count}} post slot(s) this week.',
  },
  posts_not_needed: {
    key: 'workflow.founder_os.toast.posts_not_needed',
    fallback: 'No new post slots needed this week.',
  },
  posts_plan_failed: {
    key: 'workflow.founder_os.toast.posts_plan_failed',
    fallback: 'Failed to plan weekly posts.',
  },
} as const;

export function getFounderOsCopy(
  key: keyof typeof FOUNDER_OS_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = FOUNDER_OS_COPY[key];
  return wf(entry.key, entry.fallback, t, values);
}

export function getFounderOsCopyManifest(): Record<string, string> {
  return Object.fromEntries(Object.values(FOUNDER_OS_COPY).map((entry) => [entry.key, entry.fallback]));
}
