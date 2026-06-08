import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  sendTeamFormNotification,
  sendWaitlistConfirmation,
} from '@/lib/marketing-email';
import { syncWaitlistToProspects } from '@/lib/prospect-sync';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const waitlistSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  organisation: z.string().min(1),
  role: z.string().min(1),
  commodity: z.string().min(1),
  producer_range: z.string().min(1),
  source_page: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = waitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const data = parsed.data;
    const sourcePage = data.source_page?.trim() || '/';
    const supabase = getSupabaseAdmin();

    const { error: insertError } = await supabase.from('waitlist_signups').insert({
      email: data.email.trim().toLowerCase(),
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      organisation: data.organisation.trim(),
      role: data.role.trim(),
      commodity: data.commodity.trim(),
      producer_range: data.producer_range.trim(),
      source_page: sourcePage,
      raw_payload: body,
    });

    let isNewSignup = true;

    if (insertError) {
      if (insertError.code === '23505') {
        isNewSignup = false;
      } else {
        return NextResponse.json(
          {
            error:
              'Could not save waitlist signup. Ensure waitlist_signups exists in Supabase.',
            detail: insertError.message,
          },
          { status: 500 },
        );
      }
    }

    if (isNewSignup) {
      await syncWaitlistToProspects(supabase, {
        firstName: data.first_name.trim(),
        lastName: data.last_name.trim(),
        email: data.email.trim().toLowerCase(),
        organisation: data.organisation.trim(),
        role: data.role.trim(),
        commodity: data.commodity.trim(),
        producerRange: data.producer_range.trim(),
        sourcePage,
      }).catch((error: unknown) => {
        console.error('[waitlist] prospect sync failed:', error);
      });

      await sendTeamFormNotification({
        subject: `[Tracebud] Waitlist signup — ${data.organisation.trim()}`,
        headline: 'New waitlist signup',
        fields: {
          Name: `${data.first_name.trim()} ${data.last_name.trim()}`,
          Email: data.email.trim().toLowerCase(),
          Organisation: data.organisation.trim(),
          Role: data.role.trim(),
          Commodity: data.commodity.trim(),
          'Producer range': data.producer_range.trim(),
          Source: sourcePage,
        },
      }).catch((error: unknown) => {
        console.error('[waitlist] team notification failed:', error);
      });
    }

    const confirmationSent = isNewSignup
      ? await sendWaitlistConfirmation({
          email: data.email.trim().toLowerCase(),
          firstName: data.first_name.trim(),
          organisation: data.organisation.trim(),
        }).catch((error: unknown) => {
          console.error('[waitlist] confirmation email failed:', error);
          return false;
        })
      : false;

    return NextResponse.json(
      { success: true, confirmationSent, duplicate: !isNewSignup },
      { status: 200 },
    );
  } catch (error) {
    console.error('[waitlist] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
