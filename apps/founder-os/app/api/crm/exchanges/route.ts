import { NextResponse } from 'next/server';
import { createOutreachActivity, listOutreachActivity } from '@/lib/crm-service';

export async function GET() {
  try {
    const activities = await listOutreachActivity();
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load outreach activity.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    prospect_id?: string;
    content?: string;
    activity_type?: string;
    channel?: string;
  };
  if (!body.prospect_id || !body.content) {
    return NextResponse.json({ error: 'prospect_id and content are required.' }, { status: 400 });
  }

  try {
    const activity = await createOutreachActivity({
      prospect_id: body.prospect_id,
      content: body.content,
      activity_type: body.activity_type,
      channel: body.channel,
    });
    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create outreach activity.' },
      { status: 500 }
    );
  }
}
