/** Classify tenure parse failures for farmer-facing copy (not dev error strings). */
export type TenureParseFailureKind = 'service' | 'photo' | 'wrong_document';

export function classifyTenureParseError(error: string): TenureParseFailureKind {
  const text = error.trim().toLowerCase();
  if (!text) return 'photo';

  if (
    /not (a |an )?(land|title|deed|lease)\b/.test(text) ||
    /\bwrong document\b/.test(text) ||
    /\bunrelated\b/.test(text)
  ) {
    return 'wrong_document';
  }

  if (
    /download|storage|supabase|not configured|object not found|could not download|tenure parse failed \(\d{3}\)|invalid json|empty content|unsupported mime|network|timeout|rate limit|gateway|service unavailable|temporarily unavailable|fetch failed|econnreset|enotfound/.test(
      text,
    )
  ) {
    return 'service';
  }

  if (/ocr|unreadable|blur|illegible|could not read|empty content/.test(text)) {
    return 'photo';
  }

  return 'service';
}

export function isRetryableTenureParseFailure(error: string): boolean {
  return classifyTenureParseError(error) === 'service';
}
