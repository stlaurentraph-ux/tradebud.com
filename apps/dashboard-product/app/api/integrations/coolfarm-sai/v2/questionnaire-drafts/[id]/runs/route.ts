import { NextResponse } from 'next/server';
import { proxyJson } from '../../../_utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await proxyJson(
      request,
      `/v1/integrations/coolfarm-sai/v2/questionnaire-drafts/${encodeURIComponent(id)}/runs`,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load run details.' },
      { status: 500 },
    );
  }
}
