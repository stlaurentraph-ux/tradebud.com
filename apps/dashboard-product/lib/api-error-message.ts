type ApiErrorBody = {
  error?: string;
  message?: string | string[] | { message?: string };
};

export function formatApiErrorBody(body: unknown, fallback: string, status?: number): string {
  if (!body || typeof body !== 'object') {
    return statusHint(status) ?? fallback;
  }

  const payload = body as ApiErrorBody;

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    const msg = payload.message.trim();
    if (msg.toLowerCase() !== 'bad request') {
      return msg;
    }
  }

  if (Array.isArray(payload.message)) {
    const parts = payload.message
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  const nestedMessage = payload.message;
  if (
    nestedMessage &&
    typeof nestedMessage === 'object' &&
    !Array.isArray(nestedMessage) &&
    typeof nestedMessage.message === 'string' &&
    nestedMessage.message.trim()
  ) {
    return nestedMessage.message.trim();
  }

  return statusHint(status) ?? fallback;
}

function statusHint(status?: number): string | null {
  if (status === 401) {
    return 'Session expired. Sign in again and retry.';
  }
  if (status === 403) {
    return 'You do not have permission to create this plot for the selected producer.';
  }
  if (status === 503) {
    return 'Plot service is unavailable. Contact support if this continues.';
  }
  if (status === 400) {
    return 'The server rejected this plot. Check producer ID, coordinates, and area, or use Launch data request if details are missing.';
  }
  return null;
}

export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return formatApiErrorBody(body, fallback, response.status);
}
