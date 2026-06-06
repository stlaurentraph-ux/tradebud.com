import { getAccessTokenFromSupabase } from '@/features/api/auth';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

const API_BASE_URL = getTracebudApiBaseUrl();

export type QuestionnaireFieldDefinition = {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array';
  required: boolean;
  unit?: string;
};

export type QuestionnaireSectionDefinition = {
  id: string;
  title: string;
  required: boolean;
  fields: QuestionnaireFieldDefinition[];
};

export type AssessmentQuestionnaireSchemaResponse = {
  requestId: string;
  pathway: 'annuals' | 'rice';
  schema: {
    sections: QuestionnaireSectionDefinition[];
  };
};

export type AssessmentQuestionnaireDraftResponse = {
  requestId: string;
  questionnaireId: string;
  status: string;
  pathway: string;
  response: Record<string, string | number | boolean | unknown[]>;
  updatedAt: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for assessment questionnaire');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchAssessmentQuestionnaireSchema(
  requestId: string,
): Promise<AssessmentQuestionnaireSchemaResponse> {
  const res = await fetch(
    `${API_BASE_URL}/v1/integrations/assessments/requests/${encodeURIComponent(requestId)}/questionnaire-schema`,
    { headers: await authHeaders() },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Questionnaire schema fetch error: ${res.status}`);
  }
  return res.json();
}

export async function fetchAssessmentQuestionnaireDraft(
  requestId: string,
): Promise<AssessmentQuestionnaireDraftResponse> {
  const res = await fetch(
    `${API_BASE_URL}/v1/integrations/assessments/requests/${encodeURIComponent(requestId)}/questionnaire`,
    { headers: await authHeaders() },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Questionnaire fetch error: ${res.status}`);
  }
  return res.json();
}

export async function saveAssessmentQuestionnaireResponses(params: {
  requestId: string;
  response: Record<string, unknown>;
}): Promise<AssessmentQuestionnaireDraftResponse> {
  const res = await fetch(
    `${API_BASE_URL}/v1/integrations/assessments/requests/${encodeURIComponent(params.requestId)}/questionnaire/responses`,
    {
      method: 'PATCH',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response: params.response }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Questionnaire save error: ${res.status}`);
  }
  return res.json();
}

export async function submitAssessmentQuestionnaire(requestId: string): Promise<{
  requestId: string;
  questionnaireId: string;
  status: string;
}> {
  const res = await fetch(
    `${API_BASE_URL}/v1/integrations/assessments/requests/${encodeURIComponent(requestId)}/questionnaire/submit`,
    {
      method: 'POST',
      headers: await authHeaders(),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Questionnaire submit error: ${res.status}`);
  }
  return res.json();
}

export function questionnaireFieldKey(sectionId: string, fieldId: string): string {
  return `${sectionId}.${fieldId}`;
}

export function coerceFieldInput(
  type: QuestionnaireFieldDefinition['type'],
  raw: string,
): string | number | boolean | unknown[] {
  const trimmed = raw.trim();
  if (type === 'number') {
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : trimmed;
  }
  if (type === 'boolean') {
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    return trimmed;
  }
  if (type === 'array') {
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{ value: trimmed }];
    }
  }
  return trimmed;
}

export function formatFieldValueForInput(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}
