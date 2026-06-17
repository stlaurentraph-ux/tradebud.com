const appJson = require('./app.json');

const SENTRY_ORG = process.env.SENTRY_ORG ?? 'tracebud';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT ?? 'react-native';

const PRODUCTION_NOTIFICATIONS_PLUGIN = [
  'expo-notifications',
  {
    icon: './assets/images/icon.png',
    color: '#0B4F3B',
  },
];

const SENTRY_PLUGIN = [
  '@sentry/react-native/expo',
  {
    url: 'https://sentry.io/',
    organization: SENTRY_ORG,
    project: SENTRY_PROJECT,
  },
];

function isSentryPlugin(entry) {
  const name = Array.isArray(entry) ? entry[0] : entry;
  return name === '@sentry/react-native' || name === '@sentry/react-native/expo';
}

function withSentryPlugin(plugins) {
  const withoutSentry = plugins.filter((entry) => !isSentryPlugin(entry));
  return [...withoutSentry, SENTRY_PLUGIN];
}

function withAppleSignInPlugin(plugins) {
  const hasApple = plugins.some((p) => (Array.isArray(p) ? p[0] : p) === 'expo-apple-authentication');
  return hasApple ? plugins : [...plugins, 'expo-apple-authentication'];
}

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const includePush = profile === 'production' || profile === 'simulator';

  const plugins = withAppleSignInPlugin(withSentryPlugin([...(config.plugins ?? appJson.expo.plugins)]));
  if (includePush && !plugins.some((p) => (Array.isArray(p) ? p[0] : p) === 'expo-notifications')) {
    plugins.push(PRODUCTION_NOTIFICATIONS_PLUGIN);
  }

  const ios = { ...(config.ios ?? appJson.expo.ios) };
  if (includePush) {
    ios.entitlements = {
      ...(ios.entitlements ?? {}),
      'aps-environment': 'production',
    };
  }
  // Universal links require Associated Domains on the provisioning profile (production).
  // Preview/ad-hoc profiles use EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 instead.
  if (profile === 'production' || profile === 'simulator') {
    ios.associatedDomains = [
      ...(ios.associatedDomains ?? []),
      'applinks:app.tracebud.com',
    ].filter((value, index, arr) => arr.indexOf(value) === index);
  }

  const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const iosGoogleSchemeMatch =
    iosGoogleClientId && /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(iosGoogleClientId);
  if (iosGoogleSchemeMatch) {
    const reversedScheme = `com.googleusercontent.apps.${iosGoogleSchemeMatch[1]}`;
    const existingTypes = ios.infoPlist?.CFBundleURLTypes ?? [];
    const hasScheme = existingTypes.some((entry) =>
      (entry.CFBundleURLSchemes ?? []).includes(reversedScheme),
    );
    if (!hasScheme) {
      ios.infoPlist = {
        ...(ios.infoPlist ?? {}),
        CFBundleURLTypes: [...existingTypes, { CFBundleURLSchemes: [reversedScheme] }],
      };
    }
  }

  const android = { ...(config.android ?? appJson.expo.android) };
  const existingFilters = android.intentFilters ?? [];
  const hasAppLinkFilter = existingFilters.some(
    (filter: { data?: { host?: string }[] }) =>
      filter.data?.some((d) => d.host === 'app.tracebud.com'),
  );
  if (!hasAppLinkFilter) {
    android.intentFilters = [
      ...existingFilters,
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'app.tracebud.com',
            pathPrefix: '/auth',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ];
  }

  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  const googleOAuth = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() || undefined,
  };
  const extra = {
    ...(appJson.expo.extra ?? {}),
    ...(config.extra ?? {}),
    ...(sentryDsn ? { sentryDsn } : {}),
    googleOAuth,
  };

  return {
    ...appJson.expo,
    ...config,
    ios,
    android,
    plugins,
    extra,
  };
};
