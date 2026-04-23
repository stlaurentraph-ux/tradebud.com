'use client';

export type OnboardingActionKey =
  | 'campaign_created'
  | 'contacts_uploaded'
  | 'team_invited'
  | 'insight_generated'
  | 'campaign_joined'
  | 'first_plot_captured'
  | 'first_submission_synced'
  | 'submission_reviewed'
  | 'compliance_check_run';

function storageKey(actionKey: OnboardingActionKey): string {
  return `tracebud_onboarding_action_${actionKey}`;
}

type OnboardingRole = 'admin' | 'field_operator' | 'compliance_manager';

const ACTION_STEP_KEY_MAP: Record<OnboardingActionKey, string> = {
  campaign_created: 'create_first_campaign',
  contacts_uploaded: 'upload_contacts',
  team_invited: 'invite_field_team',
  insight_generated: 'generate_first_insight',
  campaign_joined: 'join_campaign',
  first_plot_captured: 'capture_first_plot',
  first_submission_synced: 'sync_first_submission',
  submission_reviewed: 'review_first_submission',
  compliance_check_run: 'run_first_compliance_check',
};

function resolveOnboardingRole(): OnboardingRole {
  const userRaw = window.sessionStorage.getItem('tracebud_user');
  if (!userRaw) return 'admin';
  try {
    const user = JSON.parse(userRaw) as { active_role?: string };
    if (user.active_role === 'cooperative') return 'field_operator';
    if (user.active_role === 'importer' || user.active_role === 'country_reviewer') {
      return 'compliance_manager';
    }
    return 'admin';
  } catch {
    return 'admin';
  }
}

function syncOnboardingCompletion(actionKey: OnboardingActionKey): void {
  const stepKey = ACTION_STEP_KEY_MAP[actionKey];
  if (!stepKey) return;
  const token = window.sessionStorage.getItem('tracebud_token');
  if (!token) return;
  const role = resolveOnboardingRole();
  void fetch('/api/launch/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role, stepKey }),
  }).catch(() => undefined);
}

export function markOnboardingAction(actionKey: OnboardingActionKey): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(storageKey(actionKey), '1');
  syncOnboardingCompletion(actionKey);
  window.dispatchEvent(new CustomEvent('tracebud:onboarding-action'));
}
