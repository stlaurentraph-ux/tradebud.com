import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

type LeadEmailParams = {
  to: string
  firstName: string
  company: string
  lookingFor: string
}

export async function sendLeadConfirmationEmail({
  to,
  firstName,
  company,
  lookingFor,
}: LeadEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    // Silently skip if email is not configured
    return
  }

  const subject = "Tracebud – we received your request"

  const friendlyLookingFor =
    lookingFor === "eudr-compliance"
      ? "EUDR compliance data"
      : lookingFor === "free-mapping"
        ? "free mapping software"
        : "a partnership"

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #022c22; padding: 24px;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">Hi ${firstName || ""},</h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
        Thanks for reaching out to Tracebud about ${friendlyLookingFor} for ${company}.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
        A member of our team will review your request and get back to you within 24 hours to discuss your supply chain and next steps.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
        If you shared specific requirements in the form, we’ll use those to tailor the conversation.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin: 24px 0 8px;">
        Warm regards,<br/>
        The Tracebud team
      </p>
      <p style="font-size: 12px; line-height: 1.4; color: #64748b; margin-top: 16px;">
        You’re receiving this email because you submitted a request on tracebud.com.
      </p>
    </div>
  `

  await resend.emails.send({
    from: "Tracebud <hello@tracebud.com>",
    to,
    subject,
    html,
  })
}

