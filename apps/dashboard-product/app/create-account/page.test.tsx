// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateAccountPage from './page';
import { markOnboardingAction } from '@/lib/onboarding-actions';

const pushMock = vi.fn();
const hydrateSessionFromTokenMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img alt={props.alt} />,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    hydrateSessionFromToken: hydrateSessionFromTokenMock,
  }),
}));

describe('CreateAccountPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    hydrateSessionFromTokenMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    });
    sessionStorage.clear();
  });

  it('renders step 1 value proposition and minimum fields', () => {
    render(<CreateAccountPage />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument();
  });

  it('moves from step 1 to step 2 on successful signup', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/auth/signup') {
        return new Response(
          JSON.stringify({ userId: 'user_1', tenantId: 'tenant_1', accessToken: 'token_1' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: 'Unexpected call' }), { status: 500 });
    });

    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'ops@tracebud.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'supersecret' } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ops User' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Organization name')).toBeInTheDocument();
    });
    expect(hydrateSessionFromTokenMock).toHaveBeenCalledWith('token_1');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/auth/signup',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('maps importer onboarding action sync after account setup flow', async () => {
    hydrateSessionFromTokenMock.mockImplementation((token: string) => {
      sessionStorage.setItem('tracebud_token', token);
      sessionStorage.setItem(
        'tracebud_user',
        JSON.stringify({
          id: 'user_1',
          email: 'ops@tracebud.test',
          full_name: 'Ops User',
          tenant_id: 'tenant_1',
          roles: ['exporter'],
          active_role: 'exporter',
        }),
      );
    });
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/auth/signup') {
        const body = JSON.parse(String(init?.body ?? '{}')) as { stage?: string };
        if (body.stage === 'create_account') {
          return new Response(
            JSON.stringify({ userId: 'user_1', tenantId: 'tenant_1', accessToken: 'token_1' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (body.stage === 'workspace_setup') {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      if (input === '/api/launch/commercial-profile') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (input === '/api/launch/onboarding') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'Unexpected call' }), { status: 500 });
    });

    render(<CreateAccountPage />);

    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'ops@tracebud.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'supersecret' } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ops User' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Organization name')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'Tracebud Imports' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'Country' }));
    fireEvent.click(await screen.findByRole('option', { name: 'France' }));
    fireEvent.click(screen.getByRole('button', { name: /Importer/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Skip for now' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/?welcome=1&entry=inbox');
    });

    markOnboardingAction('campaign_created');

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/launch/onboarding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token_1',
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
