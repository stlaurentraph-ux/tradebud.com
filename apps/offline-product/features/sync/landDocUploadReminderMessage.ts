export function appendLandDocsReminderToSyncCompleteMessage(
  baseMessage: string,
  plotNames: string[],
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (plotNames.length === 0) return baseMessage;
  const reminder = t('sync_result_land_docs_on_phone', { names: plotNames.join(', ') });
  return `${baseMessage}\n\n${reminder}`;
}
