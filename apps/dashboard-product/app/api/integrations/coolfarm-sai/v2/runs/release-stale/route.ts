import { NextResponse } from 'next/server';
import { proxyJson } from '../../_utils';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    return await proxyJson(request, '/v1/integrations/coolfarm-sai/v2/runs/release-stale', {
      method: 'POST',
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to release stale claims.' },
      { status: 500 },
    );
  }
}
