const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const appNodeModules = path.resolve(projectRoot, 'node_modules');
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');

/** npm workspaces lockfile paths baked into older debug builds on device. */
const WORKSPACE_MODULE_PREFIX = /^\.\/?apps\/offline-product\/node_modules\//;

function blockPath(target) {
  return new RegExp(`${target.replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`);
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(projectRoot);

// Watch monorepo for shared sources; never bundle root react-native (0.85) — field app is 0.81.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [appNodeModules];
config.resolver.disableHierarchicalLookup = true;
config.resolver.blockList = [
  blockPath(path.resolve(rootNodeModules, 'react-native')),
  blockPath(path.resolve(rootNodeModules, '@react-native')),
];
config.resolver.extraNodeModules = {
  'react-native': path.resolve(appNodeModules, 'react-native'),
  '@react-native/codegen': path.resolve(appNodeModules, '@react-native/codegen'),
  '@react-native/babel-plugin-codegen': path.resolve(
    appNodeModules,
    '@react-native/babel-plugin-codegen',
  ),
  'expo-router': path.resolve(appNodeModules, 'expo-router'),
  expo: path.resolve(appNodeModules, 'expo'),
};

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
