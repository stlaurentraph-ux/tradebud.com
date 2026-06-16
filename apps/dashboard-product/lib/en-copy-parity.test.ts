import { describe, expect, it } from 'vitest';
import en from '@/locales/en.json';
import { getWorkflowCopyManifest } from '@/lib/workflow-copy-manifest';

describe('EN copy parity smoke', () => {
  it('registers workflow copy helper keys in en.json', () => {
    const manifest = getWorkflowCopyManifest();
    const missing: string[] = [];
    const mismatched: string[] = [];

    for (const [key, fallback] of Object.entries(manifest)) {
      if (!(key in en)) {
        missing.push(key);
        continue;
      }
      if (en[key as keyof typeof en] !== fallback) {
        mismatched.push(key);
      }
    }

    expect(missing, `Missing ${missing.length} keys`).toEqual([]);
    expect(mismatched, `Mismatched ${mismatched.length} keys`).toEqual([]);
  });
});
