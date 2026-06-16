// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeCard } from '@/components/onboarding/welcome-card';
import { LocaleContext } from '@/lib/locale-context';
import { t as translate } from '@/lib/i18n';

describe('WelcomeCard', () => {
  it('renders localized English fallbacks', () => {
    render(
      <LocaleContext.Provider
        value={{
          locale: 'en',
          timezone: 'UTC',
          availableLocales: ['en'],
          setLocale: () => undefined,
          setTimezone: () => undefined,
          t: (key) => translate(key, 'en'),
        }}
      >
        <WelcomeCard
          userName="Alex Morgan"
          onDismiss={() => undefined}
          onStartOnboarding={() => undefined}
          onExploreWorkspace={() => undefined}
        />
      </LocaleContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: /Welcome to Tracebud, Alex/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start onboarding' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore workspace first' })).toBeInTheDocument();
  });
});
