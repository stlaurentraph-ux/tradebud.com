import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import { getBackendBase } from '../../../_utils';

export async function POST(request: Request) {
  try {
    const backendBase = getBackendBase();
    if (backendBase instanceof NextResponse) {
      return backendBase;
    }

    const authHeader = request.headers.get('authorization');
    const body = await request.json().catch(() => ({}));
    const schedulerToken = process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN?.trim();
    if (!schedulerToken) {
      return NextResponse.json(
        { error: 'COOLFARM_SAI_V2_SCHEDULER_TOKEN is not configured for scheduler trigger proxy.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tracebud-scheduler-token': schedulerToken,
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger scheduled stale sweeper.' },
      { status: 500 },
    );
  }
}
