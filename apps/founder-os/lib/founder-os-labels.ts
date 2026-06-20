import { getFounderOsCopy } from './founder-os-copy';

type AsyncScope =
  | 'crm.prospects'
  | 'crm.templates'
  | 'crm.daily_actions'
  | 'content.calendar'
  | 'content.tasks'
  | 'content.review';

const FALLBACK_TITLES: Record<AsyncScope, Record<'loading' | 'error' | 'empty', string>> = {
  'crm.prospects': {
    loading: 'Loading prospects...',
    error: 'Failed to load prospects',
    empty: 'No prospects yet',
  },
  'crm.templates': {
    loading: 'Loading templates...',
    error: 'Failed to load templates',
    empty: 'No templates found',
  },
  'crm.daily_actions': {
    loading: 'Loading daily actions...',
    error: 'Failed to load daily actions',
    empty: 'No actions for this day',
  },
  'content.calendar': {
    loading: 'Loading content calendar...',
    error: 'Failed to load content calendar',
    empty: 'No content scheduled yet',
  },
  'content.tasks': {
    loading: 'Loading content tasks...',
    error: 'Failed to load content tasks',
    empty: 'No content tasks yet',
  },
  'content.review': {
    loading: 'Loading review data...',
    error: 'Failed to load review data',
    empty: 'No review items pending',
  },
};

const FALLBACK_HINTS: Partial<Record<AsyncScope, string>> = {
  'crm.prospects': 'Add leads from website forms or manual research.',
  'crm.templates': 'Adjust your filter or seed template data.',
  'crm.daily_actions': 'Try another date or generate actions in Supabase.',
  'content.calendar': 'Add calendar items to see publishing rhythm.',
  'content.tasks': 'Generate tasks from cadence settings.',
  'content.review': 'Draft and scheduled content will appear here.',
};

export function getWorkflowAsyncStateCopy(
  scope: AsyncScope,
  mode: 'loading' | 'error' | 'empty',
): { title: string; description?: string } {
  const title = FALLBACK_TITLES[scope][mode];
  if (mode !== 'empty') {
    return { title };
  }
  const description = FALLBACK_HINTS[scope];
  return description ? { title, description } : { title };
}

export function getContentReviewCopy(key: string): string {
  const labels: Record<string, string> = {
    needs_review: 'Needs review',
    missed: 'Missed posts',
    overdue_tasks: 'Overdue tasks',
  };
  return labels[key] ?? key;
}

export { getFounderOsCopy };
