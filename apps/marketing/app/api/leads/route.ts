import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const leadSchema = z.object({
  formType: z.enum(["exporter", "importer", "country"]),
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

    const supabase = getSupabaseAdmin();
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

    return NextResponse.json({ ok: true });
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
