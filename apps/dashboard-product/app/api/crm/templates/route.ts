import { NextResponse } from 'next/server';
import { createOutreachTemplate, listOutreachTemplates } from '@/lib/crm-service';

export async function GET() {
  try {
    const templates = await listOutreachTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load templates.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    stage?: string;
    channel?: string;
    content?: string;
  };
  if (!body.name || !body.stage || !body.channel || !body.content) {
    return NextResponse.json(
      { error: 'name, stage, channel, and content are required.' },
      { status: 400 }
    );
  }

  try {
    const template = await createOutreachTemplate({
      name: body.name,
      stage: body.stage,
      channel: body.channel,
      content: body.content,
    });
    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template.' },
      { status: 500 }
    );
  }
}
