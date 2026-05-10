/**
 * Input validation utilities for common field types.
 * Provides lightweight validation without external dependencies.
 */

export type ValidationResult<T> = 
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validate harvest weight in kg.
 * Must be a positive number, max 1,000,000 kg (1000 tons per harvest is reasonable limit).
 */
export function validateHarvestKg(value: unknown): ValidationResult<number> {
  const num = Number(value);
  
  if (Number.isNaN(num)) {
    return { ok: false, error: 'Harvest weight must be a valid number' };
  }
  
  if (num <= 0) {
    return { ok: false, error: 'Harvest weight must be greater than 0' };
  }
  
  if (num > 1_000_000) {
    return { ok: false, error: 'Harvest weight exceeds maximum of 1,000,000 kg' };
  }
  
  // Allow up to 2 decimal places
  const rounded = Math.round(num * 100) / 100;
  return { ok: true, value: rounded };
}

/**
 * Validate latitude coordinate (-90 to 90).
 */
export function validateLatitude(value: unknown): ValidationResult<number> {
  const num = Number(value);
  
  if (Number.isNaN(num)) {
    return { ok: false, error: 'Latitude must be a valid number' };
  }
  
  if (num < -90 || num > 90) {
    return { ok: false, error: 'Latitude must be between -90 and 90' };
  }
  
  return { ok: true, value: num };
}

/**
 * Validate longitude coordinate (-180 to 180).
 */
export function validateLongitude(value: unknown): ValidationResult<number> {
  const num = Number(value);
  
  if (Number.isNaN(num)) {
    return { ok: false, error: 'Longitude must be a valid number' };
  }
  
  if (num < -180 || num > 180) {
    return { ok: false, error: 'Longitude must be between -180 and 180' };
  }
  
  return { ok: true, value: num };
}

/**
 * Validate GPS coordinate pair.
 */
export function validateGpsCoordinates(lat: unknown, lng: unknown): ValidationResult<{ latitude: number; longitude: number }> {
  const latResult = validateLatitude(lat);
  if (!latResult.ok) return { ok: false, error: latResult.error };
  
  const lngResult = validateLongitude(lng);
  if (!lngResult.ok) return { ok: false, error: lngResult.error };
  
  return {
    ok: true,
    value: {
      latitude: latResult.value,
      longitude: lngResult.value,
    },
  };
}

/**
 * Validate postal address (min 5 chars, max 500).
 */
export function validatePostalAddress(value: unknown): ValidationResult<string> {
  const str = String(value).trim();
  
  if (str.length < 5) {
    return { ok: false, error: 'Address must be at least 5 characters' };
  }
  
  if (str.length > 500) {
    return { ok: false, error: 'Address must not exceed 500 characters' };
  }
  
  return { ok: true, value: str };
}

/**
 * Validate email format (basic check).
 */
export function validateEmail(value: unknown): ValidationResult<string> {
  const str = String(value).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(str)) {
    return { ok: false, error: 'Invalid email format' };
  }
  
  return { ok: true, value: str };
}

/**
 * Validate commodity code (ISO 6-digit alphanumeric or HS code).
 * Examples: "070111", "A00001"
 */
export function validateCommodityCode(value: unknown): ValidationResult<string> {
  const str = String(value).trim().toUpperCase();
  
  if (str.length < 4 || str.length > 10) {
    return { ok: false, error: 'Commodity code must be 4-10 characters' };
  }
  
  if (!/^[A-Z0-9]+$/.test(str)) {
    return { ok: false, error: 'Commodity code must contain only letters and numbers' };
  }
  
  return { ok: true, value: str };
}

/**
 * Validate plot area in hectares.
 * Must be positive, max 10,000 hectares (~100 km²).
 */
export function validatePlotAreaHa(value: unknown): ValidationResult<number> {
  const num = Number(value);
  
  if (Number.isNaN(num)) {
    return { ok: false, error: 'Plot area must be a valid number' };
  }
  
  if (num <= 0) {
    return { ok: false, error: 'Plot area must be greater than 0' };
  }
  
  if (num > 10_000) {
    return { ok: false, error: 'Plot area exceeds maximum of 10,000 hectares' };
  }
  
  // Allow up to 4 decimal places
  const rounded = Math.round(num * 10000) / 10000;
  return { ok: true, value: rounded };
}

/**
 * Validate consent/checkbox value.
 */
export function validateConsent(value: unknown): ValidationResult<boolean> {
  if (typeof value === 'boolean') {
    return { ok: true, value };
  }
  
  return { ok: false, error: 'Consent is required' };
}

/**
 * Validate required string field (non-empty after trim).
 */
export function validateRequired(value: unknown, fieldName: string = 'Field'): ValidationResult<string> {
  const str = String(value).trim();
  
  if (!str) {
    return { ok: false, error: `${fieldName} is required` };
  }
  
  return { ok: true, value: str };
}
