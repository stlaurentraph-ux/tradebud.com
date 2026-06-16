const DEFAULT_FIELD_AUTH_CALLBACK = 'https://app.tracebud.com/auth/callback';
const DEFAULT_FIELD_AUTH_CONFIRM = 'https://app.tracebud.com/auth/confirm';

/** HTTPS OAuth / universal-link callback base (no query string). */
export function getFieldAuthCallbackBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_OAUTH_BRIDGE_URL?.trim();
  return (override || DEFAULT_FIELD_AUTH_CALLBACK).replace(/\/$/, '');
}

/** Email confirmation redirect for farmer sign-up. */
export function getFieldAppEmailConfirmUrl(): string {
  const override = process.env.EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL?.trim();
  return (override || DEFAULT_FIELD_AUTH_CONFIRM).replace(/\/$/, '');
}
