import { NextResponse } from 'next/server';
import { createProspect, listProspects, updateProspect } from '@/lib/crm-service';

export async function GET() {
  try { return NextResponse.json({ prospects: await listProspects() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string; company?: string; email?: string; notes?: string };
  if (!body.name || !body.company) return NextResponse.json({ error: 'name and company required' }, { status: 400 });
  try { return NextResponse.json({ prospect: await createProspect(body as { name: string; company: string; email?: string; notes?: string }) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; stage?: string; segment?: string | null; notes?: string | null };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try { return NextResponse.json({ prospect: await updateProspect(body.id, body) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
