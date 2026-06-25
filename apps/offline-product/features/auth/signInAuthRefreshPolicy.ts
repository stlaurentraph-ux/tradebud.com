/** While the create-account wizard is open, auth refresh must not close it or adopt the session. */
export function shouldDeferAuthRefreshForCreateAccountWizard(createWizardVisible: boolean): boolean {
  return createWizardVisible;
}

/** Deep-link OAuth completion should not tear down the create-account wizard mid-flow. */
export function shouldSkipDeepLinkAuthSurfaceClose(createWizardVisible: boolean): boolean {
  return createWizardVisible;
}
