import { t as translate, type Locale } from '@/lib/i18n';
import {
  getImporterReviewQueueDescription,
  getImporterReviewQueueEmptyDescription,
  getMiniReviewImporterFilingAction,
} from '@/lib/terminology-labels';
import type { ShipmentStatus, TenantRole } from '@/types';

type TranslateFn = (key: string) => string;
type ReviewQueueRole = Extract<TenantRole, 'importer' | 'country_reviewer'>;

const EN_WORKFLOW_LABELS: Record<string, string> = {
  'workflow.review_queue.importer.title': 'Review queue',
  'workflow.review_queue.importer.view_all': 'Open full compliance workspace',
  'workflow.review_queue.importer.empty_title': 'No shipments awaiting review',
  'workflow.review_queue.importer.empty_cta': 'Launch campaign',
  'workflow.review_queue.reviewer.title': 'Compliance review queue',
  'workflow.review_queue.reviewer.description':
    'Packages flagged for jurisdiction review — act inline without leaving the dashboard',
  'workflow.review_queue.reviewer.view_all': 'Open full queue',
  'workflow.review_queue.reviewer.empty_title': 'Queue is clear',
  'workflow.review_queue.reviewer.empty_description':
    'No packages are waiting for compliance review in your jurisdiction.',
  'workflow.review_queue.reviewer.empty_cta': 'Browse queue',
  'workflow.review_queue.action.review_shipment': 'Review shipment',
  'workflow.review_queue.action.resolve_hold': 'Resolve hold',
  'workflow.review_queue.action.review_package': 'Review package',
  'workflow.review_queue.risk.high': 'High risk',
  'workflow.review_queue.risk.medium': 'Medium risk',
  'workflow.review_queue.risk.low': 'Low risk',
  'workflow.review_queue.blocked': 'Blocked',
  'workflow.review_queue.load_error_prefix': 'Could not load review queue.',
  'workflow.review_queue.updated.recently': 'Recently updated',
  'workflow.review_queue.updated.today': 'Updated today',
  'workflow.review_queue.updated.yesterday': 'Updated yesterday',
  'workflow.review_queue.updated.days_ago': 'Updated {{days}}d ago',
  'workflow.review_queue.plots_one': '{{count}} plot',
  'workflow.review_queue.plots_other': '{{count}} plots',
};

function resolveLabel(key: string, t?: TranslateFn, locale: Locale = 'en'): string {
  if (t) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  const fromLocale = translate(key, locale);
  if (fromLocale !== key) return fromLocale;
  return EN_WORKFLOW_LABELS[key] ?? key;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}

export function getReviewQueueActionLabel(
  role: ReviewQueueRole,
  status: ShipmentStatus,
  t?: TranslateFn,
): string {
  if (role === 'importer') {
    if (status === 'SEALED') {
      return getMiniReviewImporterFilingAction(t);
    }
    if (status === 'ON_HOLD') {
      return resolveLabel('workflow.review_queue.action.resolve_hold', t);
    }
    return resolveLabel('workflow.review_queue.action.review_shipment', t);
  }
  return resolveLabel('workflow.review_queue.action.review_package', t);
}

export function getReviewQueueRiskLabel(
  level: 'low' | 'medium' | 'high',
  t?: TranslateFn,
): string {
  return resolveLabel(`workflow.review_queue.risk.${level}`, t);
}

export function getReviewQueueBlockedLabel(t?: TranslateFn): string {
  return resolveLabel('workflow.review_queue.blocked', t);
}

export function formatReviewQueueRelativeAge(isoDate: string, t?: TranslateFn): string {
  const updated = new Date(isoDate).getTime();
  if (Number.isNaN(updated)) {
    return resolveLabel('workflow.review_queue.updated.recently', t);
  }
  const days = Math.max(0, Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24)));
  if (days === 0) return resolveLabel('workflow.review_queue.updated.today', t);
  if (days === 1) return resolveLabel('workflow.review_queue.updated.yesterday', t);
  const template = resolveLabel('workflow.review_queue.updated.days_ago', t);
  return interpolate(template, { days });
}

export function formatReviewQueuePlotCount(count: number, t?: TranslateFn): string {
  const key = count === 1 ? 'workflow.review_queue.plots_one' : 'workflow.review_queue.plots_other';
  return interpolate(resolveLabel(key, t), { count });
}

export function getMiniReviewQueueCopy(role: ReviewQueueRole, t?: TranslateFn) {
  if (role === 'importer') {
    return {
      title: resolveLabel('workflow.review_queue.importer.title', t),
      description: getImporterReviewQueueDescription(t),
      viewAllHref: '/compliance',
      viewAllLabel: resolveLabel('workflow.review_queue.importer.view_all', t),
      emptyTitle: resolveLabel('workflow.review_queue.importer.empty_title', t),
      emptyDescription: getImporterReviewQueueEmptyDescription(t),
      emptyCtaHref: '/outreach?new=1',
      emptyCtaLabel: resolveLabel('workflow.review_queue.importer.empty_cta', t),
    };
  }

  return {
    title: resolveLabel('workflow.review_queue.reviewer.title', t),
    description: resolveLabel('workflow.review_queue.reviewer.description', t),
    viewAllHref: '/compliance/queue',
    viewAllLabel: resolveLabel('workflow.review_queue.reviewer.view_all', t),
    emptyTitle: resolveLabel('workflow.review_queue.reviewer.empty_title', t),
    emptyDescription: resolveLabel('workflow.review_queue.reviewer.empty_description', t),
    emptyCtaHref: '/compliance/queue',
    emptyCtaLabel: resolveLabel('workflow.review_queue.reviewer.empty_cta', t),
  };
}

export function getReviewQueueLoadErrorPrefix(t?: TranslateFn): string {
  return resolveLabel('workflow.review_queue.load_error_prefix', t);
}
