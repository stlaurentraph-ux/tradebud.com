/**
 * Node-safe stand-in for `react-native` used only by Vitest (see `vitest.config.ts` alias).
 *
 * The real `react-native/index.js` ships Flow syntax (`import typeof ...`) that Rollup/Vitest
 * cannot parse, so any unit test whose import graph transitively touches `react-native` would
 * fail to load. Business-logic tests never render UI, so this stub only needs to resolve the
 * named exports the app imports and provide benign runtime behavior for the members that are
 * actually evaluated at module load (Platform, StyleSheet, AppState, Alert, Linking, Dimensions).
 *
 * Tests that need specific behavior should still `vi.mock('react-native', ...)`, which takes
 * precedence over this alias.
 */

type AnyRecord = Record<string, unknown>;

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  Version: 0 as number | string,
  select: <T,>(spec: { ios?: T; android?: T; native?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.native ?? spec.default,
  isPad: false,
  isTV: false,
};

export const StyleSheet = {
  create: <T extends AnyRecord>(styles: T): T => styles,
  flatten: (style: unknown): AnyRecord =>
    Array.isArray(style) ? Object.assign({}, ...style) : ((style as AnyRecord) ?? {}),
  hairlineWidth: 1,
  absoluteFill: {},
  absoluteFillObject: {},
};

export const AppState = {
  currentState: 'active' as string,
  addEventListener: (_type: string, _handler: (state: string) => void) => ({
    remove: () => undefined,
  }),
};

export const Alert = {
  alert: (..._args: unknown[]) => undefined,
};

export const Linking = {
  openURL: async (_url: string) => undefined,
  canOpenURL: async (_url: string) => true,
  getInitialURL: async () => null,
  addEventListener: (_type: string, _handler: (event: { url: string }) => void) => ({
    remove: () => undefined,
  }),
};

export const Dimensions = {
  get: (_dim: 'window' | 'screen') => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
  addEventListener: (_type: string, _handler: (...args: unknown[]) => void) => ({
    remove: () => undefined,
  }),
};

export const Keyboard = {
  dismiss: () => undefined,
  addListener: (_type: string, _handler: (...args: unknown[]) => void) => ({
    remove: () => undefined,
  }),
};

export const NativeModules: AnyRecord = {};

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  roundToNearestPixel: (n: number) => n,
};

export const InteractionManager = {
  runAfterInteractions: (task?: () => void) => {
    task?.();
    return { then: (cb: () => void) => cb(), done: () => undefined, cancel: () => undefined };
  },
};

// UI components are never rendered in unit tests; identity placeholders are enough for imports.
const passthroughComponent = (props: AnyRecord = {}) => props.children ?? null;

export const View = passthroughComponent;
export const Text = passthroughComponent;
export const Image = passthroughComponent;
export const ScrollView = passthroughComponent;
export const Pressable = passthroughComponent;
export const TouchableOpacity = passthroughComponent;
export const TouchableWithoutFeedback = passthroughComponent;
export const TextInput = passthroughComponent;
export const Switch = passthroughComponent;
export const Modal = passthroughComponent;
export const ActivityIndicator = passthroughComponent;
export const KeyboardAvoidingView = passthroughComponent;
export const Share = { share: async (_content: AnyRecord) => ({ action: 'sharedAction' }) };

export const useWindowDimensions = () => ({ width: 375, height: 812, scale: 2, fontScale: 1 });

export default {
  Platform,
  StyleSheet,
  AppState,
  Alert,
  Linking,
  Dimensions,
  Keyboard,
  NativeModules,
  PixelRatio,
  InteractionManager,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Share,
  useWindowDimensions,
};
