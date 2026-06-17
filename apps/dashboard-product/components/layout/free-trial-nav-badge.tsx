'use client';

import Link from 'next/link';
import { SETTINGS_LICENSE_PATH } from '@/lib/settings-paths';
import { useContext } from 'react';
import { Sparkles } from 'lucide-react';
import { LocaleContext } from '@/lib/locale-context';
import { useLaunchState } from '@/lib/use-launch-state';
import { getAppChromeCopy } from '@/lib/workflow-terminology-labels';

export function FreeTrialNavBadge() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { launchState } = useLaunchState();

  if (launchState?.lifecycle_status !== 'trial_active') {
    return null;
  }

  const title =
    launchState.trial_expires_at != null
      ? getAppChromeCopy('free_trial_ends', t, {
          date: new Date(launchState.trial_expires_at).toLocaleDateString(),
        })
      : getAppChromeCopy('free_trial_hint', t);

  return (
    <Link
      href={SETTINGS_LICENSE_PATH}
      className="mb-2 inline-flex w-full items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-50 transition-colors hover:bg-emerald-500/20"
      title={title}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-200" aria-hidden="true" />
      <span className="font-medium">{getAppChromeCopy('free_trial_label', t)}</span>
    </Link>
  );
}
