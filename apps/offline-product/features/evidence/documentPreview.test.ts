import { describe, expect, it } from 'vitest';

import { canOpenExternally, resolveDocumentOpenStrategy } from './documentPreview';

describe('canOpenExternally', () => {
  it('allows local file and content URIs', () => {
    expect(canOpenExternally('file:///var/mobile/doc.pdf')).toBe(true);
    expect(canOpenExternally('content://com.android.providers/doc/123')).toBe(true);
  });

  it('allows remote https signed storage URLs', () => {
    expect(canOpenExternally('https://signed.example/title.jpg')).toBe(true);
  });

  it('rejects synthetic text signature URIs', () => {
    expect(canOpenExternally('text:fpic_signature:Jane%20Doe')).toBe(false);
  });

  it('rejects unsafe / unexpected schemes', () => {
    expect(canOpenExternally('http://insecure.example/doc.pdf')).toBe(false);
    expect(canOpenExternally('javascript:alert(1)')).toBe(false);
    expect(canOpenExternally('data:text/html,<script>x</script>')).toBe(false);
    expect(canOpenExternally('evilapp://open?x=1')).toBe(false);
  });

  it('rejects empty or scheme-less input', () => {
    expect(canOpenExternally('')).toBe(false);
    expect(canOpenExternally('/var/mobile/doc.pdf')).toBe(false);
    expect(canOpenExternally(undefined as unknown as string)).toBe(false);
  });
});

describe('resolveDocumentOpenStrategy', () => {
  it('opens remote https documents in the browser', () => {
    expect(resolveDocumentOpenStrategy('https://signed.example/title.pdf')).toBe('browser');
  });

  it('routes local file/content documents through the share/FileProvider path', () => {
    // Regression: `Linking.openURL('file://…')` throws FileUriExposedException on Android 7+, so
    // local docs must use `share`, never the browser/Linking path.
    expect(resolveDocumentOpenStrategy('file:///var/mobile/doc.pdf')).toBe('share');
    expect(resolveDocumentOpenStrategy('content://com.android.providers/doc/123')).toBe('share');
  });

  it('returns null for non-openable / blocked schemes', () => {
    expect(resolveDocumentOpenStrategy('text:fpic_signature:Jane%20Doe')).toBeNull();
    expect(resolveDocumentOpenStrategy('http://insecure.example/doc.pdf')).toBeNull();
    expect(resolveDocumentOpenStrategy('javascript:alert(1)')).toBeNull();
    expect(resolveDocumentOpenStrategy('')).toBeNull();
  });
});
