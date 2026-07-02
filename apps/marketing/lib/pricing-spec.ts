/** Canonical dashboard pricing bands — TRACEBUD_PRICING_SPEC.md (Compliance Starter bundle). */

export const COMPLIANCE_STARTER_BANDS = [
  { label: "Starter", sublabel: "1–50 managed contacts", price: "€19" },
  { label: "Growth", sublabel: "51–500 managed contacts", price: "€49" },
  { label: "Scale", sublabel: "501–3,000 managed contacts", price: "€99" },
  { label: "Enterprise", sublabel: "3,001+ managed contacts", price: "Custom" },
] as const;

export const PRICING_SHIPMENT_USAGE_NOTE =
  "Your monthly plan covers your network. Each shipment costs €1 when export data is sealed and €1 when import data is submitted to EU.";

export const ORIGIN_SHIPMENT_USAGE_FEE = "€1.00";
export const DESTINATION_SHIPMENT_USAGE_FEE = "€1.00";
