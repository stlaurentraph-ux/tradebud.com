import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export type OfflineRuntimeBuildKind = 'metro' | 'ota' | 'embedded' | 'release';

export type OfflineRuntimeBuildDisplay = {
  kind: OfflineRuntimeBuildKind;
  headlineKey:
    | 'settings_build_kind_metro'
    | 'settings_build_kind_ota'
    | 'settings_build_kind_embedded'
    | 'settings_build_kind_release';
  detail: string;
  appVersion: string;
  showOauthRebuildHint: boolean;
};

function inferOfflineRuntimeBuildKind(): OfflineRuntimeBuildKind {
  if (Updates.isEmbeddedLaunch) return 'embedded';
  if (__DEV__) return 'metro';
  if (Updates.isEnabled) return 'ota';
  return 'release';
}

/** Human-readable label for the installed build (dev client vs OTA preview vs store). */
export function describeOfflineRuntimeBuild(): string {
  const parts: string[] = [];

  const executionEnvironment = Constants.executionEnvironment;
  if (executionEnvironment) {
    parts.push(`exec:${executionEnvironment}`);
  }
  if (Constants.appOwnership) {
    parts.push(`ownership:${Constants.appOwnership}`);
  }

  const kind = inferOfflineRuntimeBuildKind();
  if (kind === 'embedded') {
    parts.push('bundle:embedded');
  } else if (kind === 'ota') {
    parts.push(`bundle:ota${Updates.channel ? `:${Updates.channel}` : ''}`);
  } else if (kind === 'metro') {
    parts.push('bundle:metro');
  } else {
    parts.push('bundle:release');
  }

  return parts.join(' · ');
}

/** True when JS comes from an EAS Update / embedded bundle — Metro reload will not apply OAuth fixes. */
export function offlineRuntimeUsesEmbeddedBundle(): boolean {
  return inferOfflineRuntimeBuildKind() !== 'metro';
}

export function getOfflineRuntimeBuildDisplay(): OfflineRuntimeBuildDisplay {
  const kind = inferOfflineRuntimeBuildKind();
  const headlineKey =
    kind === 'metro'
      ? 'settings_build_kind_metro'
      : kind === 'ota'
        ? 'settings_build_kind_ota'
        : kind === 'embedded'
          ? 'settings_build_kind_embedded'
          : 'settings_build_kind_release';

  const appVersion =
    Constants.nativeAppVersion ??
    Constants.expoConfig?.version ??
    (typeof Constants.manifest2?.extra?.expoClient?.version === 'string'
      ? Constants.manifest2.extra.expoClient.version
      : '1.0.0');

  return {
    kind,
    headlineKey,
    detail: describeOfflineRuntimeBuild(),
    appVersion,
    showOauthRebuildHint: kind !== 'metro',
  };
}
