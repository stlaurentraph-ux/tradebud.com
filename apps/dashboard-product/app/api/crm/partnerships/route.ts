import { NextResponse } from 'next/server';
import { createPartnership, listPartnerships } from '@/lib/founder-os-gtm-service';

export async function GET() {
  try { return NextResponse.json({ partnerships: await listPartnerships() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { organization_name?: string; partner_type?: string; country?: string; notes?: string };
  if (!body.organization_name || !body.partner_type) return NextResponse.json({ error: 'organization_name and partner_type required' }, { status: 400 });
  try { return NextResponse.json({ partnership: await createPartnership(body as Parameters<typeof createPartnership>[0]) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
