import { describe, expect, it } from 'vitest';

import {
  OAuthFlowError,
  getOAuthErrorContext,
  isOAuthFlowError,
} from './oauthFlowError';

describe('oauthFlowError', () => {
  it('carries step and path on OAuthFlowError', () => {
    const error = new OAuthFlowError('sign_in_oauth_failed', {
      step: 'native_token_exchange',
      path: 'native',
    });
    expect(isOAuthFlowError(error)).toBe(true);
    expect(getOAuthErrorContext(error)).toEqual({
      step: 'native_token_exchange',
      path: 'native',
      raw: 'sign_in_oauth_failed',
    });
  });

  it('extracts raw message from generic errors', () => {
    expect(getOAuthErrorContext(new Error('Invalid login credentials'))).toEqual({
      raw: 'Invalid login credentials',
    });
  });
});
