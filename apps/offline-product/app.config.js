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

function isPrivateLanApiUrl(apiUrl) {
  if (!apiUrl?.trim()) return false;
  try {
    const parsed = new URL(apiUrl.replace(/\/$/, ''));
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const includePush = profile === 'production' || profile === 'simulator';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const allowInsecureLanApi = isPrivateLanApiUrl(apiUrl);

  const plugins = withAppleSignInPlugin(withSentryPlugin([...(config.plugins ?? appJson.expo.plugins)]));
  if (includePush && !plugins.some((p) => (Array.isArray(p) ? p[0] : p) === 'expo-notifications')) {
    plugins.push(PRODUCTION_NOTIFICATIONS_PLUGIN);
  }

  const ios = { ...(config.ios ?? appJson.expo.ios) };
  if (allowInsecureLanApi) {
    ios.infoPlist = {
      ...(ios.infoPlist ?? {}),
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
      NSLocalNetworkUsageDescription:
        'Tracebud connects to your computer on the same Wi‑Fi to upload plots and deliveries during development.',
    };
  }
  if (includePush) {
    ios.entitlements = {
      ...(ios.entitlements ?? {}),
      'aps-environment': 'production',
    };
  }
  // Universal links require Associated Domains on the provisioning profile (production).
  // Preview/ad-hoc profiles use EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 instead.
  const useUniversalLinksOAuth =
    (profile === 'production' || profile === 'simulator') &&
    process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME !== '1';
  if (useUniversalLinksOAuth) {
    ios.associatedDomains = [
      ...(ios.associatedDomains ?? []),
      'applinks:app.tracebud.com',
    ].filter((value, index, arr) => arr.indexOf(value) === index);
  }

  const googleReversedSchemeFromClientId = (clientId) => {
    const match = clientId && /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(clientId);
    return match ? `com.googleusercontent.apps.${match[1]}` : null;
  };

  const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const iosGoogleScheme = googleReversedSchemeFromClientId(iosGoogleClientId);
  if (iosGoogleScheme) {
    const existingTypes = ios.infoPlist?.CFBundleURLTypes ?? [];
    const hasScheme = existingTypes.some((entry) =>
      (entry.CFBundleURLSchemes ?? []).includes(iosGoogleScheme),
    );
    if (!hasScheme) {
      ios.infoPlist = {
        ...(ios.infoPlist ?? {}),
        CFBundleURLTypes: [...existingTypes, { CFBundleURLSchemes: [iosGoogleScheme] }],
      };
    }
  }

  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const android = { ...(config.android ?? appJson.expo.android) };
  if (allowInsecureLanApi) {
    android.usesCleartextTraffic = true;
  }
  if (googleMapsApiKey) {
    android.config = {
      ...(android.config ?? {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    };
  }
  const existingFilters = android.intentFilters ?? [];
  const hasAppLinkFilter = existingFilters.some(
    (filter) =>
      filter.data?.some((d) => d.host === 'app.tracebud.com'),
  );
  const androidGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  const androidGoogleScheme = googleReversedSchemeFromClientId(androidGoogleClientId);
  const intentFilters = [...existingFilters];
  if (!hasAppLinkFilter) {
    intentFilters.push({
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
    });
  }
  if (
    androidGoogleScheme &&
    !intentFilters.some((filter) =>
      filter.data?.some((entry) => entry.scheme === androidGoogleScheme),
    )
  ) {
    intentFilters.push({
      action: 'VIEW',
      data: [{ scheme: androidGoogleScheme }],
      category: ['BROWSABLE', 'DEFAULT'],
    });
  }
  if (intentFilters.length > existingFilters.length) {
    android.intentFilters = intentFilters;
  }
  if (androidGoogleScheme) {
    const existingQueries = android.queries ?? [];
    if (!existingQueries.some((query) => query.scheme === androidGoogleScheme)) {
      android.queries = [...existingQueries, { scheme: androidGoogleScheme }];
    }
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
    googleMapsConfigured: Boolean(googleMapsApiKey),
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
