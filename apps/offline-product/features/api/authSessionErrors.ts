/** NestJS SupabaseAuthGuard and mobile auth refresh failures. */
export function isInvalidTokenApiMessage(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  const normalized = message.trim().toLowerCase();
  return (
    normalized === 'invalid token' ||
    normalized === 'missing bearer token' ||
    normalized.includes('jwt expired') ||
    normalized.includes('sign_in_session_expired')
  );
}

export function isAuthSessionApiFailure(status: number, message: unknown): boolean {
  return status === 401 || isInvalidTokenApiMessage(message);
}

export function isAuthSessionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.trim().toLowerCase();
  return (
    isInvalidTokenApiMessage(message) ||
    message === 'sign_in_session_expired' ||
    message === 'no access token available for audit log'
  );
}
