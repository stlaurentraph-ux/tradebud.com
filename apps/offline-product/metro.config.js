const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const appNodeModules = path.resolve(projectRoot, 'node_modules');

/** npm workspaces lockfile paths baked into older debug builds on device. */
const WORKSPACE_MODULE_PREFIX = /^\.\/?apps\/offline-product\/node_modules\//;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(projectRoot);

// Field app is self-contained (Expo SDK 54 / RN 0.81). Never resolve JS from root node_modules —
// root is Next.js and must not hoist a second react-native stack into Metro.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [appNodeModules];
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'db'];

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  let resolvedName = moduleName;
  if (WORKSPACE_MODULE_PREFIX.test(resolvedName)) {
    resolvedName = resolvedName.replace(WORKSPACE_MODULE_PREFIX, '');
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, resolvedName, platform);
  }
  return context.resolveRequest(context, resolvedName, platform);
};

module.exports = config;
