import { NextResponse } from 'next/server';
import { createProspect, listProspects } from '@/lib/crm-service';

export async function GET() {
  try {
    const prospects = await listProspects();
    return NextResponse.json({ prospects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load prospects.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    company?: string;
    email?: string;
    notes?: string;
  };
  if (!body.name || !body.company) {
    return NextResponse.json({ error: 'name and company are required.' }, { status: 400 });
  }

  try {
    const prospect = await createProspect({
      name: body.name,
      company: body.company,
      email: body.email,
      notes: body.notes,
    });
    return NextResponse.json({ prospect });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create prospect.' },
      { status: 500 }
    );
  }
}
