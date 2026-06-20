/**
 * Canonical Sentry environment resolution for deployable Tracebud surfaces.
 * Used by sentry-env-tags-guard.mjs and mirrored in app sentry-options modules.
 */

/** Environments that should appear in Sentry for staging/production deploys. */
export const DEPLOYED_SENTRY_ENVIRONMENTS = new Set(['staging', 'production']);

/**
 * @param {Record<string, string | undefined>} env
 * @param {{ explicitKey?: string }} [options]
 */
export function resolveSentryEnvironment(env, options = {}) {
  const explicitKey = options.explicitKey ?? 'NEXT_PUBLIC_SENTRY_ENVIRONMENT';
  const explicit = env[explicitKey]?.trim() || env.SENTRY_ENVIRONMENT?.trim();
  if (explicit) {
    return explicit;
  }

  const vercelEnv = env.VERCEL_ENV?.trim();
  if (vercelEnv === 'production') {
    return 'production';
  }
  if (vercelEnv === 'preview') {
    return 'staging';
  }
  if (vercelEnv === 'development') {
    return 'development';
  }

  const railwayEnv = env.RAILWAY_ENVIRONMENT_NAME?.trim();
  if (railwayEnv === 'production') {
    return 'production';
  }
  if (railwayEnv) {
    return 'staging';
  }

  return env.NODE_ENV === 'production' ? 'production' : 'development';
}

/**
 * @param {string} environment
 */
export function assertDeployedSentryEnvironment(environment, context) {
  if (!DEPLOYED_SENTRY_ENVIRONMENTS.has(environment)) {
    throw new Error(
      `${context}: expected Sentry environment "staging" or "production", got "${environment}"`,
    );
  }
}
