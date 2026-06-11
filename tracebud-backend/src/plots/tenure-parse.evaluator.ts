import type { TenureParseResultV1, TenureParseStatus } from './tenure-parse.types';

const MANUAL_CONFIDENCE_THRESHOLD = 0.6;
const ANTI_FRAUD_CONFIDENCE_CAP = 0.5;

export function computeParseConfidence(result: TenureParseResultV1): number {
  const ocr = result.confidence_breakdown?.ocr_quality ?? 0;
  const fields = result.confidence_breakdown?.field_completeness ?? 0;
  const avg = (ocr + fields) / 2;
  const antiFraud = result.anti_fraud;
  if (
    antiFraud &&
    (!antiFraud.metadata_timestamp_plausible ||
      !antiFraud.issuer_name_match ||
      !antiFraud.document_age_within_policy)
  ) {
    return Math.min(avg, ANTI_FRAUD_CONFIDENCE_CAP);
  }
  return Math.max(0, Math.min(1, avg));
}

export function evaluateTenureParseResult(result: TenureParseResultV1): {
  parse_status: TenureParseStatus;
  parse_confidence: number;
} {
  const parse_confidence = computeParseConfidence(result);
  const missingCritical =
    result.tenure_type === 'CUSTOMARY' || result.tenure_type === 'POSSESSION_DECLARATION'
      ? result.clauses_missing.length > 0
      : result.clauses_missing.length > 2;

  if (result.parser === 'manual_required_stub') {
    return { parse_status: 'MANUAL_REQUIRED', parse_confidence: 0 };
  }

  const crossCheckRequiresReview =
    result.cadastral_cross_check?.requires_manual_review === true;

  if (
    parse_confidence < MANUAL_CONFIDENCE_THRESHOLD ||
    missingCritical ||
    crossCheckRequiresReview
  ) {
    return { parse_status: 'MANUAL_REQUIRED', parse_confidence };
  }

  return { parse_status: 'COMPLETED', parse_confidence };
}
