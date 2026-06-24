/** Step in the OAuth pipeline — surfaced in analytics when sign-in fails. */
export type OAuthFlowStep =
  | 'native_prompt'
  | 'native_code'
  | 'native_token_exchange'
  | 'supabase_id_token'
  | 'browser_start'
  | 'browser_callback'
  | 'session_persist'
  | 'browser_fallback';

export type OAuthFlowPath = 'native' | 'browser';

/** Stable i18n / mapOAuthErrorToCode message carried on thrown errors. */
export class OAuthFlowError extends Error {
  readonly oauthStep: OAuthFlowStep;
  readonly oauthPath: OAuthFlowPath;

  constructor(
    message: string,
    options: { step: OAuthFlowStep; path?: OAuthFlowPath },
  ) {
    super(message);
    this.name = 'OAuthFlowError';
    this.oauthStep = options.step;
    this.oauthPath = options.path ?? 'native';
  }
}

export function getOAuthErrorContext(error: unknown): {
  step?: OAuthFlowStep;
  path?: OAuthFlowPath;
  raw?: string;
} {
  if (error instanceof OAuthFlowError) {
    return { step: error.oauthStep, path: error.oauthPath, raw: error.message };
  }
  if (error instanceof Error) {
    return { raw: error.message };
  }
  return { raw: String(error) };
}

export function isOAuthFlowError(error: unknown): error is OAuthFlowError {
  return error instanceof OAuthFlowError;
}
