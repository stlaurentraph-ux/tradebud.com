import { NextResponse } from 'next/server';

function isDevSignupBypassEnabled(): boolean {
  return process.env.TRACEBUD_DEV_SIGNUP_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const body = await request.json().catch(() => ({}));

  if (isDevSignupBypassEnabled()) {
    return NextResponse.json({
      ok: true,
      profile: {
        tenant_id: 'tenant_dev_local',
        primary_role: typeof body.primaryRole === 'string' ? body.primaryRole : 'admin',
        team_size: typeof body.teamSize === 'string' ? body.teamSize : null,
        main_commodity: typeof body.mainCommodity === 'string' ? body.mainCommodity : null,
        primary_objective: typeof body.primaryObjective === 'string' ? body.primaryObjective : null,
        profile_skipped: Boolean((body as { skipped?: unknown }).skipped),
        updated_at: new Date().toISOString(),
      },
      message: 'Local dev signup bypass enabled.',
    });
  }

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required.' }, { status: 401 });
  }

  const response = await fetch(`${backendBase}/v1/launch/commercial-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return NextResponse.json(payload);
}
