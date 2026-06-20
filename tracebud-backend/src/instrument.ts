import * as Sentry from '@sentry/nestjs';

import { getBaseSentryOptions } from './observability/sentry-options';

const options = getBaseSentryOptions();
if (options.dsn) {
  Sentry.init(options);
}
