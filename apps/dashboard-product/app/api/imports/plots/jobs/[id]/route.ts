import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for bulk plot import jobs.' },
      { status: 503 },
    );
  }
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required.' }, { status: 401 });
  }

  const { id } = await context.params;
  const response = await fetch(backendApiUrl(backendBase, `/v1/imports/plots/jobs/${id}`), {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  return NextResponse.json(payload, { status: response.status });
}
