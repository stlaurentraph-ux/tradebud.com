/**
 * Stub for `expo-sqlite` in the vitest (node) environment.
 *
 * The TypeScript barrels (`persistence.ts`) re-export `./persistence.native`,
 * which imports `expo-sqlite`. Its `hooks.js` ships JSX the vite transform
 * cannot parse and it requires a native runtime. Logic tests never open a real
 * database; the ones that exercise persistence (e.g. persistence.sqlite.test)
 * provide their own `vi.mock('expo-sqlite', ...)`, which overrides this alias.
 */
const notAvailable = (): never => {
  throw new Error('expo-sqlite is not available in the test environment');
};

export const openDatabaseAsync = async (): Promise<never> => notAvailable();
export const openDatabaseSync = (): never => notAvailable();
export const deleteDatabaseAsync = async (): Promise<void> => undefined;

export default { openDatabaseAsync, openDatabaseSync, deleteDatabaseAsync };
