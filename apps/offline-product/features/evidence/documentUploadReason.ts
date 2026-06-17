/** Default audit reason when the farmer does not enter one. */
export const DEFAULT_DOCUMENT_UPLOAD_REASON = 'Collected during field visit';

export function resolveDocumentUploadReason(customReason?: string | null): string {
  const trimmed = customReason?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : DEFAULT_DOCUMENT_UPLOAD_REASON;
}
