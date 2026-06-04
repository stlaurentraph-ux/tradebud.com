import { NextResponse } from 'next/server';
import { proxyJson } from '../../_utils';

export async function GET(request: Request) {
  try {
    return await proxyJson(request, '/v1/integrations/coolfarm-sai/v2/runs/summary');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load run summary.' },
      { status: 500 },
    );
  }
}
