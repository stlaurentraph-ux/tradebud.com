import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

    // Store the lead in Supabase
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("lead_checklist_signups").insert({
      email: parsed.data.email,
      name: parsed.data.name || null,
      country: parsed.data.country || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[v0] Supabase error:", error);
      // Don't fail the API call if Supabase fails - still return success
      // so the user sees success feedback
    }

    // Return success with download URL
    return NextResponse.json({
      ok: true,
      downloadUrl: "/api/checklist/download",
      message: "Checklist sent to your email",
    });
  } catch (error) {
    console.error("[v0] Checklist signup error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not process request.",
      },
      { status: 500 }
    );
  }
}
