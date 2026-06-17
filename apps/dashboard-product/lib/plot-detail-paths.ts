export function plotDetailPath(plotId: string): string {
  return `/plots/${encodeURIComponent(plotId)}`;
}

export function plotHistoryPath(plotId: string): string {
  return `/plots/${encodeURIComponent(plotId)}/history`;
}
