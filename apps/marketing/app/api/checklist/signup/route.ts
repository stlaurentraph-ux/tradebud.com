import { NextResponse } from "next/server";
import { z } from "zod";

const checklistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checklistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or payload." },
        { status: 400 }
      );
    }

    // Placeholder: In production, integrate with your email service (Brevo, SendGrid)
    // Example: await sendChecklistEmail({ email: parsed.data.email, name: parsed.data.name })

    // Return success with download URL
    return NextResponse.json({
      ok: true,
      downloadUrl: "/api/checklist/download",
      message: "Checklist sent to your email",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not process request.",
      },
      { status: 500 }
    );
  }
}
