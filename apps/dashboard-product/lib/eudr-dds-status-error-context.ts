export type EudrDdsStatusErrorContext = {
  message: string;
  occurredAt: string;
  referenceNumber: string;
};

export const EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN = '<timestamp>';

export function buildEudrDdsStatusErrorFilename(referenceNumber: string, timestampToken: string): string {
  return `eudr-dds-status-error-${referenceNumber}-${timestampToken}.json`;
}

export function serializeEudrDdsStatusErrorContext(
  context: EudrDdsStatusErrorContext,
): EudrDdsStatusErrorContext {
  return {
    message: context.message,
    occurredAt: context.occurredAt,
    referenceNumber: context.referenceNumber,
  };
}
