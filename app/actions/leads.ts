"use server"

import { createClient } from "@/lib/supabase/server"
import { sendLeadConfirmationEmail } from "@/lib/email/resend"

export type LeadFormData = {
  first_name: string
  last_name: string
  email: string
  company: string
  looking_for: string
  volume: string | null
  message: string | null
}

export async function submitLead(
  data: LeadFormData,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) {
    return {
      error: "Server is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local",
    }
  }

  const { error } = await supabase.from("leads").insert({
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim(),
    company: data.company.trim(),
    looking_for: data.looking_for,
    volume: data.volume?.trim() || null,
    message: data.message?.trim() || null,
  })

  if (error) {
    return { error: error.message }
  }

  try {
    await sendLeadConfirmationEmail({
      to: data.email.trim(),
      firstName: data.first_name.trim(),
      company: data.company.trim(),
      lookingFor: data.looking_for,
    })
  } catch {
    // Ignore email failures so lead capture still succeeds
  }

  return { error: null }
}

