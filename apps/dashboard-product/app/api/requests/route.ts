import { NextResponse } from 'next/server';

// POST /api/requests - Create a new request campaign
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      requestType,
      commodity,
      dueDate,
      message,
      recipients,
      status = 'sent', // 'sent' or 'draft'
    } = body;

    // Validate required fields
    if (!requestType || !commodity || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: requestType, commodity, and recipients are required' },
        { status: 400 }
      );
    }

    // In a real app, this would:
    // 1. Create the request campaign in the database
    // 2. Create individual request records for each recipient
    // 3. Send notifications to recipients (if status is 'sent')
    // 4. Return the created campaign

    const campaign = {
      id: `campaign_${Date.now()}`,
      requestType,
      commodity,
      dueDate,
      message,
      recipientCount: recipients.length,
      status,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      campaign,
      message: status === 'draft'
        ? 'Request saved as draft'
        : `Request sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

// GET /api/requests - List request campaigns
export async function GET() {
  // In a real app, this would fetch from the database
  // For now, return mock data
  const campaigns = [
    {
      id: 'campaign_1',
      requestType: 'documentation',
      commodity: 'Cocoa',
      recipientCount: 15,
      status: 'sent',
      responseRate: 0.73,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'campaign_2',
      requestType: 'geolocation',
      commodity: 'Coffee',
      recipientCount: 8,
      status: 'sent',
      responseRate: 0.5,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return NextResponse.json({ campaigns });
}
