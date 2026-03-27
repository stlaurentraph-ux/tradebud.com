// TypeScript doesn't understand Expo/Metro platform suffix resolution.
// This file exists for typechecking only: at runtime, Metro will resolve
// `persistence.native.ts` / `persistence.web.ts` automatically.
export * from './persistence.native';

