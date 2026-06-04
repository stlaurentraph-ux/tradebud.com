import { NextResponse } from 'next/server';
import { proxyJson } from '../../../_utils';

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params;
    const body = await request.json().catch(() => ({}));
    return await proxyJson(request, `/v1/integrations/coolfarm-sai/v2/runs/${encodeURIComponent(runId)}/retry`, {
      method: 'POST',
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retry run.' },
      { status: 500 },
    );
  }
}
