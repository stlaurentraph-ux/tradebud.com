import { redirect } from 'next/navigation';
import { SETTINGS_LICENSE_PATH } from '@/lib/settings-paths';

/** Legacy path — license/subscription management lives under /settings/license. */
export default function SettingsBillingRedirectPage() {
  redirect(SETTINGS_LICENSE_PATH);
}
