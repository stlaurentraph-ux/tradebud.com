type FormType = "exporter" | "importer" | "country" | "farmer" | "cooperative" | "pilot";

interface MapperInput {
  formType: FormType;
  name: string;
  email: string;
  company?: string | null;
  country?: string | null;
  sourcePage: string;
  payload: Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function commodityFromPayload(payload: Record<string, unknown>): string | null {
  const direct = asString(payload.commodity) ?? asString(payload.commodities);
  if (direct) return direct.toLowerCase();
  return null;
}

function companySizeFromPayload(payload: Record<string, unknown>): string | null {
  return asString(payload.companySize) ?? asString(payload.cooperativeSize) ?? asString(payload.farmSize);
}

export function mapToProspect(input: MapperInput) {
  const defaultCompany =
    input.company ??
    asString(input.payload.companyName) ??
    asString(input.payload.organizationName) ??
    asString(input.payload.cooperativeName) ??
    `${input.name} - ${input.formType}`;

  const isPilot = input.formType === "pilot";

  return {
    name: input.name,
    company: defaultCompany,
    email: input.email,
    country: input.country ?? asString(input.payload.country),
    website: asString(input.payload.website),
    commodity_focus: commodityFromPayload(input.payload),
    company_size: companySizeFromPayload(input.payload),
    source: isPilot ? "website_pilot_form" : "website_form",
    stage: isPilot ? "pilot" : "identified",
    connection_status: "not_sent",
    pilot_interest_score: isPilot ? 8 : null,
    notes: isPilot
      ? `Pilot interest from ${input.sourcePage}. ${asString(input.payload.successCriteria) ?? ""}`.trim()
      : `Captured from website form ${input.sourcePage}`,
    tags: isPilot
      ? ["source:pilot", "source:website_form", "intent:high"]
      : [`source:${input.formType}`, "source:website_form"],
  };
}

export function mapToOutreachActivity(input: MapperInput) {
  return {
    activity_type: "identified",
    channel: "website",
    content: `Website form submission from ${input.sourcePage}`,
    metadata: {
      formType: input.formType,
      sourcePage: input.sourcePage,
      email: input.email,
    },
    performed_by: "system",
  };
}
