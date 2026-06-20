import { NextResponse } from 'next/server';
import { createPilot, listPilots, updatePilot } from '@/lib/founder-os-gtm-service';

export async function GET() {
  try { return NextResponse.json({ pilots: await listPilots() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string; country?: string; commodity?: string; notes?: string };
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  try { return NextResponse.json({ pilot: await createPilot({ name: body.name, country: body.country, commodity: body.commodity, notes: body.notes }) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try { return NextResponse.json({ pilot: await updatePilot(body.id, body) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
