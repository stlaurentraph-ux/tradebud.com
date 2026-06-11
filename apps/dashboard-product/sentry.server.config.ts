import * as Sentry from '@sentry/nextjs';

import { getBaseSentryOptions } from '@/lib/observability/sentry-options';

Sentry.init(getBaseSentryOptions());
