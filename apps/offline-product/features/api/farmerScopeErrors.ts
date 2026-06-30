export const FARMER_SCOPE_VIOLATION = 'Farmer scope violation';

export function isFarmerScopeViolationMessage(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  return message.trim().toLowerCase() === FARMER_SCOPE_VIOLATION.toLowerCase();
}

export function isFarmerScopeViolationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return isFarmerScopeViolationMessage(error.message);
}
