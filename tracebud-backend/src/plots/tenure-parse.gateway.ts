/**
 * Vercel AI Gateway configuration for tenure document parsing.
 * @see https://vercel.com/docs/ai-gateway/capabilities/zdr
 * @see https://vercel.com/docs/ai-gateway/capabilities/disallow-prompt-training
 */

export type TenureParseLlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  privacy: {
    viaGateway: boolean;
    zeroDataRetention: boolean;
    disallowPromptTraining: boolean;
  };
};

const DEFAULT_GATEWAY_CHAT_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const DEFAULT_GATEWAY_MODEL = 'google/gemini-2.5-flash';

export function normalizeGatewayModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return DEFAULT_GATEWAY_MODEL;
  if (trimmed.includes('/')) return trimmed;
  if (trimmed.startsWith('gpt-') || trimmed.startsWith('o1') || trimmed.startsWith('o3') || trimmed.startsWith('o4')) {
    return `openai/${trimmed}`;
  }
  if (trimmed.startsWith('claude-')) return `anthropic/${trimmed}`;
  if (trimmed.startsWith('gemini-')) return `google/${trimmed}`;
  return trimmed;
}

export function resolveTenureParseLlmConfig(): TenureParseLlmConfig | null {
  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || '';

  if (gatewayKey) {
    const zdrEnabled = process.env.AI_TENURE_PARSE_ZDR?.trim() !== 'false';
    const rawModel = process.env.AI_TENURE_PARSE_MODEL?.trim() || DEFAULT_GATEWAY_MODEL;
    return {
      apiKey: gatewayKey,
      baseUrl: process.env.AI_GATEWAY_URL?.trim() || DEFAULT_GATEWAY_CHAT_URL,
      model: normalizeGatewayModel(rawModel),
      privacy: {
        viaGateway: true,
        zeroDataRetention: zdrEnabled,
        disallowPromptTraining: true,
      },
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) return null;

  return {
    apiKey: openaiKey,
    baseUrl: process.env.AI_GATEWAY_URL?.trim() || 'https://api.openai.com/v1/chat/completions',
    model: process.env.AI_TENURE_PARSE_MODEL?.trim() || 'gpt-4o-mini',
    privacy: {
      viaGateway: false,
      zeroDataRetention: false,
      disallowPromptTraining: false,
    },
  };
}

export function buildTenureParseRequestBody(params: {
  config: TenureParseLlmConfig;
  systemPrompt: string;
  userContent: Array<Record<string, unknown>>;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: params.config.model,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    store: false,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userContent },
    ],
  };

  if (params.config.privacy.viaGateway) {
    body.providerOptions = {
      gateway: {
        ...(params.config.privacy.zeroDataRetention ? { zeroDataRetention: true } : {}),
        disallowPromptTraining: true,
        tags: ['tenure-parse', 'eudr-tenure', 'producer-in-possession'],
      },
    };
  }

  return body;
}

export function tenureParsePrivacyWarning(config: TenureParseLlmConfig): string | null {
  if (config.privacy.viaGateway) {
    if (!config.privacy.zeroDataRetention) {
      return 'AI_TENURE_PARSE_ZDR=false: gateway routing without per-request ZDR. Enable team-wide ZDR in Vercel AI Gateway settings for compliance.';
    }
    return null;
  }
  return (
    'OPENAI_API_KEY direct path: prefer AI_GATEWAY_API_KEY with zeroDataRetention for tenure documents. ' +
    'Direct OpenAI uses store=false only; full ZDR requires Vercel AI Gateway (Pro/Enterprise) or an OpenAI ZDR agreement.'
  );
}
