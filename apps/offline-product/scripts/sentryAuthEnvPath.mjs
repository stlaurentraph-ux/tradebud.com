import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Gitignored release-only token file — NOT `.env.*` (Expo Metro would bundle those). */
export function sentryAuthEnvPath(projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  return path.join(projectRoot, 'local', 'sentry-auth.env');
}
