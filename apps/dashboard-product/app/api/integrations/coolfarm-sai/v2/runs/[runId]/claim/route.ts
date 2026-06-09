import { NextResponse } from 'next/server';
import { proxyJson } from '../../../_utils';

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params;
    return await proxyJson(request, `/v1/integrations/coolfarm-sai/v2/runs/${encodeURIComponent(runId)}/claim`, {
      method: 'POST',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to claim run.' },
      { status: 500 },
    );
  }
}
