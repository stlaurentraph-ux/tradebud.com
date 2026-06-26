/**
 * Minimal `react-native` stub for the vitest (node) environment.
 *
 * The real `react-native` entry point ships Flow syntax (`import typeof ...`)
 * that the vite/rollup transform cannot parse, and its modules expect a native
 * runtime. Logic-level tests only need these named bindings to resolve; tests
 * that exercise specific behaviour still override individual APIs with
 * `vi.mock('react-native', ...)`.
 */
const noopSubscription = { remove: () => undefined };

const passthroughStyles = {
  create: <T>(styles: T): T => styles,
  flatten: <T>(style: T): T => style,
  hairlineWidth: 1,
  absoluteFill: {},
  absoluteFillObject: {},
};

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  Version: 0 as number | string,
  select: <T>(specifics: { ios?: T; android?: T; native?: T; default?: T }): T | undefined =>
    specifics.ios ?? specifics.native ?? specifics.default,
  isPad: false,
  isTV: false,
};

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => ({}),
};

export const NativeModules = new Proxy({} as Record<string, unknown>, {
  get: () => ({}),
});

export const Alert = { alert: () => undefined, prompt: () => undefined };

export const Linking = {
  openURL: async () => undefined,
  canOpenURL: async () => true,
  getInitialURL: async () => null,
  addEventListener: () => noopSubscription,
  removeEventListener: () => undefined,
  openSettings: async () => undefined,
};

export const AppState = {
  currentState: 'active' as string,
  addEventListener: () => noopSubscription,
  removeEventListener: () => undefined,
};

export const StyleSheet = passthroughStyles;

export const Share = { share: async () => ({ action: 'sharedAction' }) };

export const Dimensions = {
  get: () => ({ width: 0, height: 0, scale: 1, fontScale: 1 }),
  addEventListener: () => noopSubscription,
  removeEventListener: () => undefined,
};

export const PixelRatio = {
  get: () => 1,
  getFontScale: () => 1,
  roundToNearestPixel: (n: number) => n,
  getPixelSizeForLayoutSize: (n: number) => n,
};

export const DeviceEventEmitter = {
  addListener: () => noopSubscription,
  emit: () => undefined,
  removeAllListeners: () => undefined,
};

export class NativeEventEmitter {
  addListener() {
    return noopSubscription;
  }
  removeAllListeners() {}
  removeSubscription() {}
  emit() {}
}

export const BackHandler = {
  addEventListener: () => noopSubscription,
  removeEventListener: () => undefined,
  exitApp: () => undefined,
};

export const AppRegistry = { registerComponent: () => undefined };

export const ActionSheetIOS = { showActionSheetWithOptions: () => undefined };

export const Keyboard = {
  dismiss: () => undefined,
  addListener: () => noopSubscription,
};

export const useWindowDimensions = () => ({ width: 0, height: 0, scale: 1, fontScale: 1 });

const Component = () => null;

export const View = Component;
export const Text = Component;
export const Pressable = Component;
export const TextInput = Component;
export const ActivityIndicator = Component;
export const ScrollView = Component;
export const Image = Component;
export const Button = Component;
export const TouchableOpacity = Component;
export const Modal = Component;
export const SafeAreaView = Component;

export const Animated = {
  View: Component,
  Text: Component,
  ScrollView: Component,
  Value: class {
    constructor(_value?: number) {}
    setValue() {}
    interpolate() {
      return this;
    }
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
  loop: () => ({ start: () => undefined, stop: () => undefined }),
  parallel: () => ({ start: (cb?: () => void) => cb?.() }),
  sequence: () => ({ start: (cb?: () => void) => cb?.() }),
};

export default {
  Platform,
  TurboModuleRegistry,
  NativeModules,
  Alert,
  Linking,
  AppState,
  StyleSheet,
  Share,
  Dimensions,
  PixelRatio,
  DeviceEventEmitter,
  NativeEventEmitter,
  BackHandler,
  AppRegistry,
  ActionSheetIOS,
  Keyboard,
  useWindowDimensions,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Button,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Animated,
};
