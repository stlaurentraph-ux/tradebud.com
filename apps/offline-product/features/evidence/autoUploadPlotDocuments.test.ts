import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DOCUMENT_UPLOAD_REASON,
  resolveDocumentUploadReason,
} from '@/features/evidence/documentUploadReason';

describe('resolveDocumentUploadReason', () => {
  it('uses default when custom reason is empty', () => {
    expect(resolveDocumentUploadReason('')).toBe(DEFAULT_DOCUMENT_UPLOAD_REASON);
    expect(resolveDocumentUploadReason('   ')).toBe(DEFAULT_DOCUMENT_UPLOAD_REASON);
    expect(resolveDocumentUploadReason(null)).toBe(DEFAULT_DOCUMENT_UPLOAD_REASON);
  });

  it('uses trimmed custom reason when provided', () => {
    expect(resolveDocumentUploadReason('  buyer audit  ')).toBe('buyer audit');
  });
});
