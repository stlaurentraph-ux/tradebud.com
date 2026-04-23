import { NextResponse } from 'next/server';

interface SignupRouteBody {
  stage?: 'create_account' | 'workspace_setup';
  [key: string]: unknown;
}

function isDevSignupBypassEnabled(): boolean {
  return process.env.TRACEBUD_DEV_SIGNUP_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createDevAccessToken(workEmail: string, tenantId: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: `dev_${workEmail}`,
      email: workEmail,
      iat: nowSeconds,
      exp: nowSeconds + 60 * 60 * 12,
      app_metadata: {
        role: 'admin',
        tenant_id: tenantId,
      },
      user_metadata: {
        role: 'admin',
        tenant_id: tenantId,
      },
    }),
  );
  return `${header}.${payload}.dev-signature`;
}

function resolveTenantFromAuthHeader(authHeader: string | null): string {
  if (!authHeader?.startsWith('Bearer ')) return 'tenant_dev_local';
  const token = authHeader.slice('Bearer '.length);
  const parts = token.split('.');
  if (parts.length < 2) return 'tenant_dev_local';
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      app_metadata?: { tenant_id?: string };
      user_metadata?: { tenant_id?: string };
    };
    return payload.app_metadata?.tenant_id ?? payload.user_metadata?.tenant_id ?? 'tenant_dev_local';
  } catch {
    return 'tenant_dev_local';
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupRouteBody;
  const stage = body.stage ?? 'create_account';
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  const authHeader = request.headers.get('authorization');

  if (isDevSignupBypassEnabled()) {
    if (stage === 'create_account') {
      const workEmail =
        typeof body.workEmail === 'string' && body.workEmail.trim().length > 0
          ? body.workEmail.trim().toLowerCase()
          : 'local.signup@tracebud.dev';
      const tenantId = `tenant_dev_${workEmail.replace(/[^a-z0-9]/gi, '_')}`;
      return NextResponse.json({
        userId: `dev_${workEmail}`,
        tenantId,
        accessToken: createDevAccessToken(workEmail, tenantId),
        refreshToken: null,
        message: 'Local dev signup bypass enabled.',
      });
    }

    if (stage === 'workspace_setup') {
      const tenantId = resolveTenantFromAuthHeader(authHeader);
      return NextResponse.json({
        ok: true,
        profile: {
          tenant_id: tenantId,
          organization_name:
            typeof body.organizationName === 'string' ? body.organizationName.trim() : 'Local QA Org',
          country: typeof body.country === 'string' ? body.country.trim() : 'France',
          primary_role: typeof body.primaryRole === 'string' ? body.primaryRole : 'admin',
          updated_at: new Date().toISOString(),
        },
      });
    }
  }

  if (!backendBase) {
    return NextResponse.json({ error: 'TRACEBUD_BACKEND_URL is required.' }, { status: 503 });
  }

  if (stage === 'workspace_setup' && !authHeader) {
    return NextResponse.json(
      { error: 'Authorization header is required for workspace setup stage.' },
      { status: 401 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${backendBase}/v1/launch/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach launch backend. Ensure backend server is running and Supabase is reachable.',
      },
      { status: 503 },
    );
  }
  const payload = await response.json().catch(() => ({ error: 'Backend request failed.' }));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  return NextResponse.json(payload);
}
