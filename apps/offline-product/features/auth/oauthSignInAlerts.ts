import { Alert } from 'react-native';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function showOAuthSignInFailureAlert(
  t: TranslateFn,
  messageCode: string,
  onCreateAccount: () => void,
): void {
  const body =
    messageCode === 'sign_in_apple_not_completed'
      ? t('sign_in_apple_not_completed')
      : messageCode === 'sign_in_field_bootstrap_failed'
        ? t('sign_in_field_bootstrap_failed')
        : messageCode === 'sign_in_api_unreachable'
          ? t('sign_in_api_unreachable')
          : messageCode === 'sign_in_dashboard_account'
            ? t('sign_in_dashboard_account')
      : messageCode === 'sign_in_oauth_needs_signup'
      ? t('sign_in_oauth_needs_signup')
      : messageCode === 'sign_in_oauth_cancelled'
        ? t('sign_in_oauth_cancelled')
        : messageCode === 'sign_in_oauth_failed'
          ? t('sign_in_oauth_failed')
          : messageCode === 'sign_in_oauth_provider_disabled'
            ? t('sign_in_oauth_provider_disabled')
          : messageCode;

  if (
    messageCode === 'sign_in_oauth_cancelled' ||
    messageCode === 'sign_in_field_bootstrap_failed' ||
    messageCode === 'sign_in_api_unreachable' ||
    messageCode === 'sign_in_dashboard_account'
  ) {
    Alert.alert(t('sign_in'), body);
    return;
  }

  Alert.alert(t('sign_in'), body, [
    { text: t('create_account'), onPress: onCreateAccount },
    { text: t('cancel'), style: 'cancel' },
  ]);
}
