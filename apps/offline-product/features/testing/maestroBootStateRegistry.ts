/**
 * Code mirror of product-os/04-quality/maestro-boot-state-registry.md
 * and qa/automation-baselines/maestro-boot-state.json.
 *
 * CI guard: maestro-boot-state-guard.mjs
 */

/** Stable Maestro anchor — visible when auth boot finished and welcome sheet is not blocking. */
export const MAESTRO_BOOT_READY_TEST_ID = 'maestro-boot-ready';

export const MAESTRO_GOLDEN_PATH_BOOT_PROFILE = 'golden_path_minimal' as const;

export const MAESTRO_BOOT_SETTING_KEYS = {
  appLanguage: 'tracebudAppLanguage',
  accountWelcomeDismissed: 'account_welcome_dismissed',
} as const;

export const MAESTRO_GOLDEN_PATH_MINIMAL_SETTINGS: Record<string, string> = {
  [MAESTRO_BOOT_SETTING_KEYS.appLanguage]: 'en',
  [MAESTRO_BOOT_SETTING_KEYS.accountWelcomeDismissed]: '1',
};

export const MAESTRO_GOLDEN_PATH_FLOW_TEST_IDS = [
  MAESTRO_BOOT_READY_TEST_ID,
  'tab-settings',
  'welcome-account-skip',
] as const;

/** Android CI copies this DB from APK assets — see maestroCiBootDatabase.native.ts */
export const MAESTRO_CI_BUNDLED_BOOT_DB_ASSET = 'assets/maestro/tracebud_offline.db' as const;
