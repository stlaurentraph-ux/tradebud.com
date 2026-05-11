/**
 * Component-level translations for hardcoded strings
 * These supplement the main translation files for component-specific content
 */

export const componentTranslations = {
  comparison: {
    title: "Tracebud vs. Manual Processes",
    subtitle: "See how Tracebud streamlines compliance",
  },
  impact: {
    metric1Label: "faster than manual processes",
    metric2Label: "data accuracy",
    metric3Label: "producer support",
  },
  hero: {
    trialDays: "30",
    deadline: "EUDR Deadline",
  },
  workflow: {
    step1: "Farm Registration",
    step2: "GPS Capture",
    step3: "Photo Documentation",
    step4: "Instant Sync",
    step5: "Compliance Ready",
  },
  footer: {
    tagline: "Trade freely. Trace easily.",
    rights: "All rights reserved.",
    companySection: "Company",
    resourcesSection: "Resources",
    legalSection: "Legal",
  },
} as const;
