// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markOnboardingAction } from './onboarding-actions';

describe('onboarding-actions helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('stores action key marker and dispatches event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    markOnboardingAction('campaign_created');
    expect(sessionStorage.getItem('tracebud_onboarding_action_campaign_created')).toBe('1');
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('posts onboarding completion when token exists', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token');
    sessionStorage.setItem(
      'tracebud_user',
      JSON.stringify({
        active_role: 'importer',
      }),
    );
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    markOnboardingAction('campaign_created');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/launch/onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer demo_token',
          }),
          body: JSON.stringify({
            role: 'compliance_manager',
            stepKey: 'create_first_campaign',
          }),
        }),
      );
    });
  });
});
