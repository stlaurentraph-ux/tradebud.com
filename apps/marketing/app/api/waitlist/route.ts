import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, first_name, last_name, organisation, commodity, producer_range } = body;

    if (!email || !first_name || !last_name || !organisation || !commodity || !producer_range) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Log lead to console for now — replace with DB/CRM integration later
    console.log("[Waitlist lead]", {
      email,
      first_name,
      last_name,
      organisation,
      commodity,
      producer_range,
      submitted_at: new Date().toISOString(),
    });

    // TODO: persist to database (Supabase/Neon) or CRM (HubSpot/Brevo)

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Waitlist error]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
