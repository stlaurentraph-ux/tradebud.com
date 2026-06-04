import { NextResponse } from 'next/server';
import { proxyJson } from '../../_utils';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const limitRaw = requestUrl.searchParams.get('limit')?.trim();
    const limitQuery = limitRaw ? `?limit=${encodeURIComponent(limitRaw)}` : '';
    return await proxyJson(request, `/v1/integrations/coolfarm-sai/v2/runs/retry-queue${limitQuery}`);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load retry queue.' },
      { status: 500 },
    );
  }
}
