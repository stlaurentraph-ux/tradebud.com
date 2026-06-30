/**
 * Maestro CI assemble flag — mirrored in product-os/04-quality/maestro-boot-state-registry.md.
 * Set via EXPO_PUBLIC_MAESTRO_CI=1 in maestro-ci-assemble-*.sh scripts.
 */

/** True when the binary was assembled for Maestro CI (embedded bundle + boot DB). */
export function isMaestroCiBuild(): boolean {
  return process.env.EXPO_PUBLIC_MAESTRO_CI === '1';
}

/**
 * Thin boot: skip network auth hydration, background bridges, and session analytics
 * so Android emulator JS reaches maestro-boot-ready faster.
 */
export function shouldUseMaestroCiThinBoot(): boolean {
  return isMaestroCiBuild();
}
