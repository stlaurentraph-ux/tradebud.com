const DEFAULT_DUE_DATE_DAYS = 30;

function formatLocalDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveCampaignDueDateIso(dueDate: Date | null): string {
  if (dueDate) {
    return formatLocalDateIso(dueDate);
  }
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + DEFAULT_DUE_DATE_DAYS);
  return formatLocalDateIso(defaultDue);
}

export function extractCampaignIdFromResponse(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  if (typeof record.campaign_id === 'string' && record.campaign_id.trim()) {
    return record.campaign_id.trim();
  }
  if (typeof record.id === 'string' && record.id.trim()) {
    return record.id.trim();
  }
  const campaign = record.campaign;
  if (campaign && typeof campaign === 'object') {
    const campaignId = (campaign as Record<string, unknown>).id;
    if (typeof campaignId === 'string' && campaignId.trim()) {
      return campaignId.trim();
    }
  }
  const data = record.data;
  if (data && typeof data === 'object') {
    const dataId = (data as Record<string, unknown>).id;
    if (typeof dataId === 'string' && dataId.trim()) {
      return dataId.trim();
    }
  }
  return '';
}

export function parseBackendErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  const message = record.message;
  if (typeof message === 'string' && message.trim() && message !== 'Bad Request') {
    return message.trim();
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.map((item) => String(item)).join(', ');
  }
  if (typeof record.error === 'string' && record.error.trim() && record.error !== 'Bad Request') {
    return record.error.trim();
  }
  return fallback;
}
