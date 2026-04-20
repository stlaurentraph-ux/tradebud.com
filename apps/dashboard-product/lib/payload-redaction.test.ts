import { describe, expect, it } from 'vitest';
import { redactSensitivePayload } from './payload-redaction';

describe('redactSensitivePayload', () => {
  it('redacts sensitive keys recursively', () => {
    const input = {
      email: 'ops@tracebud.com',
      status: 'accepted',
      actor: {
        name: 'Operator One',
        nested: {
          apiKey: 'abc123',
        },
      },
      contacts: [{ phone: '+250700000000' }],
    };

    expect(redactSensitivePayload(input)).toEqual({
      email: '[REDACTED]',
      status: 'accepted',
      actor: {
        name: '[REDACTED]',
        nested: {
          apiKey: '[REDACTED]',
        },
      },
      contacts: [{ phone: '[REDACTED]' }],
    });
  });

  it('keeps non-sensitive scalar values unchanged', () => {
    expect(redactSensitivePayload({ status: 'pending', code: 200, valid: true })).toEqual({
      status: 'pending',
      code: 200,
      valid: true,
    });
  });
});

