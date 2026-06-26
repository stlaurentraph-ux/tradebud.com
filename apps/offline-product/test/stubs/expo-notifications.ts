/**
 * Stub for `expo-notifications` in the vitest (node) environment.
 *
 * The TypeScript barrel (`registerFarmerPushToken.ts`) re-exports
 * `./registerFarmerPushToken.native`, which imports `expo-notifications`. That
 * package pulls a native runtime plus polyfills (`abort-controller`, the real
 * react-native networking core via `setUpXHR`) that break under the vite
 * transform, and it runs `setNotificationHandler(...)` at module load. Logic
 * tests never register push tokens; tests that exercise notification logic
 * provide their own `vi.mock('expo-notifications', ...)`.
 */
const noopSubscription = { remove: () => undefined };

export const setNotificationHandler = (): void => undefined;
export const setNotificationChannelAsync = async (): Promise<null> => null;
export const getExpoPushTokenAsync = async (): Promise<{ data: string }> => ({ data: '' });
export const getDevicePushTokenAsync = async (): Promise<{ data: string }> => ({ data: '' });
export const getPermissionsAsync = async (): Promise<{ status: string; granted: boolean }> => ({
  status: 'undetermined',
  granted: false,
});
export const requestPermissionsAsync = async (): Promise<{ status: string; granted: boolean }> => ({
  status: 'undetermined',
  granted: false,
});
export const getLastNotificationResponseAsync = async (): Promise<null> => null;
export const addNotificationResponseReceivedListener = () => noopSubscription;
export const addNotificationReceivedListener = () => noopSubscription;

export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
} as const;

export const AndroidNotificationVisibility = {
  UNKNOWN: 0,
  PUBLIC: 1,
  PRIVATE: 2,
  SECRET: 3,
} as const;

export const IosAuthorizationStatus = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
} as const;

export const PermissionStatus = {
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
} as const;

export default {
  setNotificationHandler,
  setNotificationChannelAsync,
  getExpoPushTokenAsync,
  getDevicePushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  getLastNotificationResponseAsync,
  addNotificationResponseReceivedListener,
  addNotificationReceivedListener,
  AndroidImportance,
  AndroidNotificationVisibility,
  IosAuthorizationStatus,
  PermissionStatus,
};
