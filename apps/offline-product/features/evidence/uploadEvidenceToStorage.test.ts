import { describe, expect, it } from 'vitest';

import { normalizeEvidenceContentType } from './evidenceContentType';

describe('normalizeEvidenceContentType', () => {
  it('detects HEIC from URI when mime is missing', () => {
    expect(
      normalizeEvidenceContentType(null, null, 'file:///var/mobile/IMG_0001.HEIC'),
    ).toBe('image/heic');
  });

  it('detects PDF from filename', () => {
    expect(normalizeEvidenceContentType(null, 'deed.pdf', 'file:///tmp/deed.pdf')).toBe(
      'application/pdf',
    );
  });

  it('prefers explicit mime type', () => {
    expect(normalizeEvidenceContentType('image/png', 'photo.jpg', 'file:///a.jpg')).toBe(
      'image/png',
    );
  });
});
