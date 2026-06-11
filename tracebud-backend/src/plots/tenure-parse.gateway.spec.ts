import {
  buildTenureParseRequestBody,
  extractJsonFromLlmContent,
  modelSupportsJsonResponseFormat,
  normalizeGatewayModel,
  resolveTenureParseLlmConfig,
} from './tenure-parse.gateway';

describe('tenure-parse.gateway', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_TENURE_PARSE_ZDR;
    delete process.env.AI_TENURE_PARSE_MODEL;
    delete process.env.AI_GATEWAY_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('prefers AI Gateway with ZDR and no-training flags', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    const config = resolveTenureParseLlmConfig();
    expect(config?.privacy.viaGateway).toBe(true);
    expect(config?.privacy.zeroDataRetention).toBe(true);
    expect(config?.privacy.disallowPromptTraining).toBe(true);
    expect(config?.baseUrl).toContain('ai-gateway.vercel.sh');
    expect(config?.model).toBe('google/gemini-2.5-flash');

    const body = buildTenureParseRequestBody({
      config: config!,
      systemPrompt: 'sys',
      userContent: [{ type: 'text', text: 'hi' }],
    });
    expect(body.store).toBe(false);
    expect(body.response_format).toBeUndefined();
    expect(body.providerOptions).toEqual({
      gateway: {
        zeroDataRetention: true,
        disallowPromptTraining: true,
        tags: ['tenure-parse', 'eudr-tenure', 'producer-in-possession'],
      },
    });
  });

  it('uses json_object mode for OpenAI models', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.AI_TENURE_PARSE_MODEL = 'openai/gpt-4o-mini';
    const config = resolveTenureParseLlmConfig();
    const body = buildTenureParseRequestBody({
      config: config!,
      systemPrompt: 'sys',
      userContent: [],
    });
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('extracts JSON from fenced gemini output', () => {
    expect(extractJsonFromLlmContent('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('can disable per-request ZDR while keeping no-training', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.AI_TENURE_PARSE_ZDR = 'false';
    const config = resolveTenureParseLlmConfig();
    const body = buildTenureParseRequestBody({
      config: config!,
      systemPrompt: 'sys',
      userContent: [],
    });
    expect((body.providerOptions as any).gateway.zeroDataRetention).toBeUndefined();
    expect((body.providerOptions as any).gateway.disallowPromptTraining).toBe(true);
  });

  it('normalizes bare OpenAI model slugs for gateway', () => {
    expect(normalizeGatewayModel('gpt-4o-mini')).toBe('openai/gpt-4o-mini');
    expect(normalizeGatewayModel('openai/gpt-5.4')).toBe('openai/gpt-5.4');
  });

  it('knows gemini does not support json response_format', () => {
    expect(modelSupportsJsonResponseFormat('google/gemini-2.5-flash')).toBe(false);
    expect(modelSupportsJsonResponseFormat('openai/gpt-4o-mini')).toBe(true);
  });
});
