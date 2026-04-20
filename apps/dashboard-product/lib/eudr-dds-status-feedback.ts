const MALFORMED_STATUS_PAYLOAD_ERROR = 'EUDR DDS status response was not valid JSON';

export function isMalformedEudrDdsStatusPayloadError(input: { message?: string }): boolean {
  const message = input.message?.trim();
  if (!message) return false;
  return message.includes(MALFORMED_STATUS_PAYLOAD_ERROR);
}

export function buildEudrDdsStatusErrorMessage(input: { message?: string }): string {
  const message = input.message?.trim();
  if (!message) {
    return 'Failed to read EUDR DDS status.';
  }
  if (isMalformedEudrDdsStatusPayloadError({ message })) {
    return 'EUDR returned malformed status payload. Retry the check or escalate to integration support.';
  }
  return message;
}
