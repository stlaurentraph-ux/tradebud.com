import { NextResponse } from "next/server";
import { z } from "zod";

import { sendLeadConfirmation, sendTeamFormNotification } from "@/lib/marketing-email";
import { syncLeadToProspects } from "@/lib/prospect-sync";
import { getSupabaseGtm } from "@/lib/supabase-admin";

const leadSchema = z.object({
  formType: z.enum([
    "exporter",
    "importer",
    "country",
    "farmer",
    "cooperative",
    "pilot",
  ]),
  sourcePage: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  payload: z.record(z.unknown()),
});

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

const FORM_LABELS: Record<string, string> = {
  exporter: "exporter interest",
  importer: "importer interest",
  country: "government / registry interest",
  farmer: "farmer interest",
  cooperative: "cooperative interest",
  pilot: "pilot program application",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid form payload." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseGtm();
    const payload = parsed.data.payload;
    let error: { message: string } | null = null;

    if (parsed.data.formType === "exporter") {
      const result = await supabase.from("exporter_leads").insert({
        company_name: parsed.data.company ?? asString(payload.companyName) ?? "",
        contact_name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        country_of_operation: parsed.data.country ?? asString(payload.country) ?? "",
        primary_commodities: asString(payload.commodities) ?? "",
        annual_export_volume: asString(payload.annualVolume) ?? "",
        sourcing_farmers_range: asString(payload.currentSourcing),
        current_eudr_challenges:
          parsed.data.message ??
          asString(payload.biggestChallenge) ??
          asString(payload.challenges),
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (parsed.data.formType === "importer") {
      const result = await supabase.from("importer_leads").insert({
        company_name: parsed.data.company ?? asString(payload.companyName) ?? "",
        contact_name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        company_size: asString(payload.companySize),
        hq_location: parsed.data.country ?? asString(payload.hqLocation),
        primary_commodities: asStringList(payload.commodities),
        annual_import_volume: asString(payload.annualImportVolume),
        origin_countries: asString(payload.originCountries),
        current_suppliers: asString(payload.currentSuppliers),
        eudr_readiness: asString(payload.eudrReadiness),
        csrd_required: Boolean(payload.csrdRequired),
        specific_requirements:
          parsed.data.message ??
          asString(payload.biggestChallenge) ??
          asString(payload.specificNeeds),
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (parsed.data.formType === "country") {
      const result = await supabase.from("country_leads").insert({
        organization_name: parsed.data.company ?? asString(payload.organizationName) ?? "",
        organization_type: asString(payload.organizationType),
        contact_name: parsed.data.name,
        title: asString(payload.title),
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        country: parsed.data.country ?? asString(payload.country),
        commodities: asStringList(payload.commodities),
        registered_producers: asString(payload.registeredProducers),
        existing_systems: asString(payload.existingSystems),
        current_challenges: asString(payload.biggestChallenge) ?? asString(payload.currentChallenges),
        integration_needs:
          parsed.data.message ??
          asString(payload.biggestChallenge) ??
          asString(payload.integrationNeeds) ??
          asString(payload.currentChallenges),
        data_standards: asStringList(payload.dataStandards),
        pilot_interest: Boolean(payload.pilotInterest),
        additional_info: asString(payload.additionalInfo),
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (parsed.data.formType === "farmer") {
      const result = await supabase.from("farmer_leads").insert({
        full_name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        country: parsed.data.country ?? asString(payload.country),
        primary_commodity: asString(payload.commodity),
        farm_size: asString(payload.farmSize),
        primary_goal: asString(payload.primaryGoal),
        biggest_challenge:
          parsed.data.message ??
          asString(payload.biggestChallenge),
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (parsed.data.formType === "cooperative") {
      const result = await supabase.from("cooperative_leads").insert({
        contact_name: parsed.data.name,
        cooperative_name: parsed.data.company ?? asString(payload.cooperativeName) ?? "",
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        country: parsed.data.country ?? asString(payload.country),
        primary_commodity: asString(payload.commodity),
        cooperative_size: asString(payload.cooperativeSize) ?? asString(payload.farmSize),
        primary_goal: asString(payload.primaryGoal),
        biggest_challenge:
          parsed.data.message ??
          asString(payload.biggestChallenge),
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (parsed.data.formType === "pilot") {
      const result = await supabase.from("pilot_leads").insert({
        pilot_role: asString(payload.pilotRole) ?? "",
        organization_name: parsed.data.company ?? asString(payload.organizationName) ?? "",
        contact_name: parsed.data.name,
        title: asString(payload.title),
        email: parsed.data.email,
        phone: parsed.data.phone ?? asString(payload.phone),
        country: parsed.data.country ?? asString(payload.country),
        primary_commodity: asString(payload.primaryCommodity),
        organization_scale: asString(payload.organizationScale),
        eudr_readiness: asString(payload.eudrReadiness),
        earliest_start: asString(payload.earliestStart),
        success_criteria: asString(payload.successCriteria) ?? "",
        additional_notes: asString(payload.additionalNotes) ?? "",
        source_page: parsed.data.sourcePage,
        raw_payload: payload,
      });
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not save lead to Supabase. Ensure per-form lead tables and columns exist.",
          detail: error.message,
        },
        { status: 500 },
      );
    }

    const formLabel = FORM_LABELS[parsed.data.formType] ?? "website form";

    await syncLeadToProspects({
      formType: parsed.data.formType,
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      country: parsed.data.country,
      sourcePage: parsed.data.sourcePage,
      payload,
    }).catch((syncError: unknown) => {
      console.error("[leads] prospect sync failed:", syncError);
    });

    await sendTeamFormNotification({
      subject: `[Tracebud] ${formLabel} — ${parsed.data.company ?? parsed.data.name}`,
      headline: `New ${formLabel}`,
      fields: {
        Name: parsed.data.name,
        Email: parsed.data.email,
        Company: parsed.data.company ?? asString(payload.organizationName) ?? asString(payload.cooperativeName),
        Phone: parsed.data.phone ?? asString(payload.phone),
        Country: parsed.data.country ?? asString(payload.country),
        "Source page": parsed.data.sourcePage,
        "Form type": parsed.data.formType,
        Message: parsed.data.message ?? asString(payload.successCriteria) ?? asString(payload.biggestChallenge),
      },
    }).catch((notifyError: unknown) => {
      console.error("[leads] team notification failed:", notifyError);
    });

    const confirmationSent = await sendLeadConfirmation({
      email: parsed.data.email,
      name: parsed.data.name,
      formLabel,
    }).catch((confirmError: unknown) => {
      console.error("[leads] confirmation email failed:", confirmError);
      return false;
    });

    return NextResponse.json({ ok: true, confirmationSent });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
