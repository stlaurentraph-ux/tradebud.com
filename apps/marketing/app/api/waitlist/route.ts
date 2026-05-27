import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, first_name, last_name, organisation, role, commodity, producer_range } = body;

    if (!email || !first_name || !last_name || !organisation || !role || !commodity || !producer_range) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    // Placeholder: In production, integrate with your email service (Brevo, SendGrid) or CRM (HubSpot)
    // Example: await sendWaitlistConfirmation({ email, first_name, organisation })

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
