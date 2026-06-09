import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET as getSchedulerConfig } from './route';

describe('Cool Farm V2 scheduler config route', () => {
  const originalToken = process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
  const originalVersion = process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION;

  beforeEach(() => {
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION;
  });

  afterEach(() => {
    if (originalToken) process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = originalToken;
    else delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    if (originalVersion) process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION = originalVersion;
    else delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION;
  });

  it('reports tokenConfigured false when scheduler token is unset', async () => {
    const res = await getSchedulerConfig();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      tokenConfigured: false,
      tokenVersion: null,
      defaultStaleMinutes: 60,
      defaultLimit: 100,
    });
  });

  it('reports tokenConfigured true and token version when configured', async () => {
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'secret-token';
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION = 'v2';

    const res = await getSchedulerConfig();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      tokenConfigured: true,
      tokenVersion: 'v2',
      defaultStaleMinutes: 60,
      defaultLimit: 100,
    });
  });
});
