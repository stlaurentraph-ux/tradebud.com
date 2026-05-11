/**
 * Accessibility utility functions and constants
 */

export const a11yLabels = {
  navigation: {
    mainMenu: 'Main navigation menu',
    mobileMenu: 'Mobile navigation menu',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  buttons: {
    joinWaitlist: 'Join the waitlist for early access',
    bookDemo: 'Schedule a 15-minute demo call',
    downloadApp: 'Download the Tracebud mobile application',
    scrollToTop: 'Scroll to the top of the page',
    toggleLanguage: 'Change website language',
  },
  forms: {
    emailInput: 'Enter your email address',
    nameInput: 'Enter your full name',
    phoneInput: 'Enter your phone number',
    roleSelect: 'Select your role in the supply chain',
    commoditySelect: 'Select your primary commodity',
    submitForm: 'Submit the form',
  },
  sections: {
    hero: 'Hero section with main value proposition',
    chainFlow: 'Supply chain flow visualization',
    workflow: 'Workflow demonstration',
    compliance: 'EUDR compliance features',
    faq: 'Frequently asked questions',
    impact: 'Platform impact and features',
    footer: 'Website footer with links',
  },
  dialogs: {
    waitlist: 'Join waitlist modal dialog',
    close: 'Close dialog',
    exitIntent: 'Exit intent dialog',
  },
  icons: {
    menu: 'Menu icon',
    close: 'Close icon',
    search: 'Search icon',
    arrow: 'Arrow icon',
    checkmark: 'Checkmark icon',
    expand: 'Expand section',
    collapse: 'Collapse section',
  },
}

/**
 * Add ARIA-live region for dynamic content updates
 */
export function AriaLive({ children, polite = true }: { children: React.ReactNode; polite?: boolean }) {
  return (
    <div
      aria-live={polite ? 'polite' : 'assertive'}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

/**
 * Generate screen-reader friendly heading structure
 */
export function HeadingWithSkipLink({ level = 1, children }: { level?: 1 | 2 | 3 | 4 | 5 | 6; children: React.ReactNode }) {
  const Tag = `h${level}` as const
  return <Tag>{children}</Tag>
}
