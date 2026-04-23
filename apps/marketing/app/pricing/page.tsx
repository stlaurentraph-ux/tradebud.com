"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, Users, Globe, ExternalLink } from "lucide-react";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DASHBOARD_URL = "https://app.tracebud.com";
const APP_STORE_URL = "https://apps.apple.com/app/tracebud";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.tracebud";

const plans = [
  {
    name: "Farmers & Micro-Producers",
    price: "Free",
    period: "",
    description: "Free forever. No setup fees, no per-farmer charges.",
    subPrice: null,
    highlights: [
      "GPS polygon capture with offline mobile app",
      "Farmer data wallet - self-sovereign GeoID ownership",
      "One-time simplified declaration (low-risk countries)",
    ],
    cta: "Download App",
    href: APP_STORE_URL,
    isApp: true,
    tier: "Tier 1",
  },
  {
    name: "Exporters & Cooperatives",
    description: "Aggregate for free. Unlock Pro analytics and the ability to ship to Europe.",
    priceTiers: [
      { label: "Starter", sublabel: "1-50 farmers", price: "€19" },
      { label: "Growth", sublabel: "51-500 farmers", price: "€49" },
      { label: "Scale", sublabel: "501-3,000 farmers", price: "€99" },
      { label: "Enterprise", sublabel: "3,000+ farmers", price: "Custom" },
    ],
    subPrice: null,
    highlights: [
      "Aggregate unlimited farmers & cooperative data",
      "Yield-cap anti-laundering validation",
      "Automated batch management & pre-export EUDR preparation",
    ],
    cta: "Start Free Trial",
    href: `${DASHBOARD_URL}/signup?role=exporter`,
    isApp: false,
    tier: "Tier 2",
  },
  {
    name: "EU Importers & Roasters",
    priceTiers: [
      { label: "Starter", sublabel: "1-5 suppliers", price: "€49" },
      { label: "Growth", sublabel: "6-25 suppliers", price: "€99" },
      { label: "Scale", sublabel: "26-100 suppliers", price: "€149" },
      { label: "Enterprise", sublabel: "100+ suppliers", price: "Custom" },
    ],
    description: "Stay EUDR-compliant. Your data retained and audit-ready, as required by law.",
    subPrice: null,
    highlights: [
      "Automated TRACES NT submission to the EU system",
      "Zero-Risk pre-flight check before every EU filing",
      "Multi-supplier risk dashboard across your sourcing network",
    ],
    cta: "Start Free Trial",
    href: `${DASHBOARD_URL}/signup?role=importer`,
    isApp: false,
    tier: "Tier 3",
  },
  {
    name: "Network Sponsors",
    price: "Custom",
    period: "",
    description: "For national export boards, certification bodies, and large traders sponsoring networks of exporters and importers.",
    subPrice: null,
    highlights: [
      "Sponsor unlimited exporter & importer orgs across your network",
      "Centralised compliance dashboard across all sponsored orgs",
      "Dedicated CSM, SLA, and custom onboarding",
    ],
    cta: "Contact Sales",
    href: "/demo",
    isApp: false,
    tier: "Tier 4",
  },
];

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Data Sovereignty",
    description: "Multi-tenant isolation, RBAC, and farmer data wallet controls",
  },
  {
    icon: Globe,
    title: "Global Commodity Support",
    description: "Coffee, cocoa, rubber, soy, and timber with HS code mapping",
  },
  {
    icon: Users,
    title: "Unlimited Organizations",
    description: "Delegated admin for cooperatives, exporters, and importers",
  },
  {
    icon: Zap,
    title: "Full Integrations",
    description: "TRACES NT, AgStack GeoID, Cool Farm Tool, EcoVadis, and more",
  },
];

const comparisonFeatures = [
  { group: "Field Data", name: "Plot Mapping & GPS", tier1: true, tier2: true, tier3: true, tier4: true },
  { group: "Field Data", name: "Polygon Capture (4+ ha)", tier1: true, tier2: true, tier3: true, tier4: true },
  { group: "Field Data", name: "Ground-Truth Photos", tier1: true, tier2: true, tier3: true, tier4: true },
  { group: "Field Data", name: "Offline Mobile App", tier1: true, tier2: true, tier3: true, tier4: true },
  { group: "Data Ownership", name: "Farmer Data Wallet (self-sovereign GeoID)", tier1: true, tier2: true, tier3: true, tier4: true },
  { group: "Supply Chain", name: "Farmer Aggregation", tier1: "Unlimited", tier2: "Unlimited", tier3: "Unlimited", tier4: "Unlimited" },
  { group: "Supply Chain", name: "Yield-Cap Anti-Laundering", tier1: false, tier2: true, tier3: true, tier4: true },
  { group: "Supply Chain", name: "Automated Batch Management", tier1: false, tier2: true, tier3: true, tier4: true },
  { group: "EUDR Compliance", name: "Simplified Declaration (micro/low-risk)", tier1: true, tier2: false, tier3: false, tier4: false },
  { group: "EUDR Compliance", name: "Pre-Export EUDR Data Preparation", tier1: false, tier2: true, tier3: true, tier4: true },
  { group: "EUDR Compliance", name: "Per-Shipment DDS (€0.50)", tier1: false, tier2: true, tier3: true, tier4: true },
  { group: "EUDR Compliance", name: "TRACES NT Submission Middleware", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "EUDR Compliance", name: "Zero-Risk Pre-Flight Check", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "EUDR Compliance", name: "EUDR 5-Year Data Retention", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "Reporting & ESG", name: "Multi-Supplier Risk Dashboard", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "Reporting & ESG", name: "ESG / CSRD Reporting (E1-E5)", tier1: false, tier2: false, tier3: "Quote", tier4: "Quote" },
  { group: "Reporting & ESG", name: "EcoVadis & Sustainalytics Connectors", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "Integrations & Support", name: "Sponsored Org Network Management", tier1: false, tier2: false, tier3: true, tier4: true },
  { group: "Integrations & Support", name: "Custom Integrations", tier1: false, tier2: "API Access", tier3: "Premium", tier4: "Custom" },
  { group: "Integrations & Support", name: "Support Level", tier1: "Community", tier2: "Email", tier3: "Dedicated", tier4: "24/7 Dedicated" },
];

const faqs = [
  {
    question: "How does pricing work across the supply chain?",
    answer:
      "Tracebud combines a monthly plan with usage-based shipment fees. Exporters and importers choose a tier based on network size, then pay +€0.50 per shipment at their side of the workflow.",
  },
  {
    question: "What does the exporter-side +€0.50 per shipment include?",
    answer:
      "Exporter-side shipment fees cover DDS package generation steps such as satellite deforestation checks, yield-cap validation, and document parsing before submission.",
  },
  {
    question: "What does the importer-side +€0.50 per shipment include?",
    answer:
      "Importer-side shipment fees cover TRACES NT submission workflow, pre-flight risk checks, EU filing operations, and 5-year audit retention handling.",
  },
  {
    question: "Do farmers and micro-producers pay subscription fees?",
    answer:
      "No. Tier 1 is free for farmers and micro-producers, including core mapping and onboarding tools designed for first-mile data capture.",
  },
  {
    question: "How do I choose between Tier 2 and Tier 3?",
    answer:
      "Tier 2 is for exporters and cooperatives managing origin-side operations. Tier 3 is for EU importers and roasters managing import-side compliance and filing.",
  },
  {
    question: "What is included in Network Sponsors (Tier 4)?",
    answer:
      "Tier 4 is for organizations sponsoring networks of exporter and importer partners. Pricing is custom and typically starts from €19/month per sponsored organization, with centralized oversight, SLA-backed support, and tailored onboarding.",
  },
  {
    question: "Can importers access ESG connectors and sponsored network management?",
    answer:
      "Yes. Importer plans include access to ESG connectors (including EcoVadis and Sustainalytics integrations) and sponsored organization network management capabilities.",
  },
];

function PriceTierToggle({
  tiers,
  active,
  onChange,
  feeNote,
}: {
  tiers: { label: string; sublabel: string; price: string }[];
  active: string;
  onChange: (label: string) => void;
  feeNote?: string;
}) {
  const current = tiers.find((t) => t.label === active) ?? tiers[0];
  const feeParts = feeNote ? feeNote.split(" ") : null;
  const feeAmount = feeParts ? feeParts[0] : "";
  const feeRemainder = feeParts ? feeParts.slice(1).join(" ") : "";
  return (
    <div className="space-y-2">
      {current.price === "Custom" ? (
        <div>
          <span className="text-5xl font-bold">Custom</span>
          <p className="text-xs leading-tight whitespace-nowrap text-muted-foreground mt-1">Contact us for a quote</p>
        </div>
      ) : (
        <div>
          <span className="text-5xl font-bold">{current.price}</span>
          <span className="text-lg text-muted-foreground ml-1">/mo</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {tiers.map((t) => (
          <button
            key={t.label}
            onClick={() => onChange(t.label)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              active === t.label
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{current.sublabel}</p>
      {feeNote && (
        <p className="text-xs text-muted-foreground">
          <span className="text-sm font-semibold text-foreground">{feeAmount}</span>{" "}
          <span>{feeRemainder}</span>
        </p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [exporterBand, setExporterBand] = useState("Starter");
  const [importerBand, setImporterBand] = useState("Starter");

  const getCtaHref = (plan: typeof plans[0], isEnterprise: boolean) => {
    if (isEnterprise || plan.tier === "Tier 4") {
      return "/demo";
    }
    return plan.href;
  };

  const getCtaLabel = (plan: typeof plans[0], isEnterprise: boolean) => {
    if (isEnterprise) return "Contact Sales";
    return plan.cta;
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-[var(--forest-canopy)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
              EUDR deadline: <strong>Dec 30, 2026</strong> (large) / <strong>Jun 30, 2027</strong> (small)
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-3 py-1 text-xs text-[var(--data-emerald)]">
              Early adopters get priority support
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Trace the source. Unlock the market.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Trial Clarity Banner */}
      <section className="py-8 px-6 bg-[var(--data-emerald)]/10 border-y border-[var(--data-emerald)]/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg text-foreground mb-1">Free Trial includes everything</h3>
              <p className="text-sm text-muted-foreground">Full dashboard access. All features. No restrictions.</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border" />
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-[var(--data-emerald)]">30</div>
                <div className="text-xs text-muted-foreground">Days free</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--data-emerald)]">0</div>
                <div className="text-xs text-muted-foreground">Credit card</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--data-emerald)]">All</div>
                <div className="text-xs text-muted-foreground">Features</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const isEnterprise =
                (plan.tier === "Tier 2" && exporterBand === "Enterprise") ||
                (plan.tier === "Tier 3" && importerBand === "Enterprise");

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-card p-6 h-full"
                >
                  <div className="flex flex-col h-full">
                    <div className="h-[128px] overflow-hidden">
                      <h3 className="font-semibold text-lg leading-tight text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                    <div className="mt-4 h-[168px]">
                      {plan.priceTiers ? (
                        <PriceTierToggle
                          tiers={plan.priceTiers}
                          active={plan.tier === "Tier 2" ? exporterBand : importerBand}
                          onChange={plan.tier === "Tier 2" ? setExporterBand : setImporterBand}
                          feeNote={
                            plan.tier === "Tier 2"
                              ? "+€0.50 / shipment*"
                              : plan.tier === "Tier 3"
                                ? "+€0.50 / shipment**"
                                : undefined
                          }
                        />
                      ) : plan.price === "Custom" ? (
                        <div>
                          <span className="text-5xl font-bold">Custom</span>
                          <p className="text-xs leading-tight whitespace-nowrap text-muted-foreground mt-1">Contact us for a quote</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-5xl font-bold">{plan.price}</span>
                          {plan.period && (
                            <span className="text-lg text-muted-foreground ml-1">{plan.period}</span>
                          )}
                          {plan.subPrice && (
                            <p className="text-xs text-muted-foreground mt-1">{plan.subPrice}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <ul className="mt-5 space-y-2 flex-1">
                      {plan.highlights.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-[var(--data-emerald)]" />
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      {plan.isApp ? (
                        <div className="flex flex-col gap-2">
                          <a
                            href={APP_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button
                              className="w-full rounded-full font-bold text-base py-6 bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                            >
                              iOS App
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          </a>
                          <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button
                              variant="outline"
                              className="w-full rounded-full font-bold text-base py-6"
                            >
                              Android App
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          </a>
                        </div>
                      ) : isEnterprise || plan.tier === "Tier 4" ? (
                        <Link href={getCtaHref(plan, isEnterprise)} className="w-full">
                          <Button
                            className="w-full rounded-full font-bold text-base py-6 bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                          >
                            {getCtaLabel(plan, isEnterprise)}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      ) : (
                        <a
                          href={getCtaHref(plan, isEnterprise)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button
                            className="w-full rounded-full font-bold text-base py-6 bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                          >
                            {getCtaLabel(plan, isEnterprise)}
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              * Exporter-side shipment fee includes DDS package generation, satellite deforestation checks, yield-cap validation, and document parsing.
            </p>
            <p className="text-xs text-muted-foreground">
              ** Importer-side shipment fee includes TRACES NT submission, pre-flight risk checks, EU filing, and 5-year audit retention.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare All Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See exactly what you get with each plan to make the right choice for your organization.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="overflow-x-auto"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Tier 1: Farmers</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground bg-[var(--data-emerald)]/10 rounded-t-lg">Tier 2: Exporters</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Tier 3: Importers</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Tier 4: Network Sponsors</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => {
                  const showGroupHeader =
                    index === 0 ||
                    comparisonFeatures[index - 1]!.group !== feature.group;
                  return (
                    <Fragment key={feature.name}>
                      {showGroupHeader && (
                        <tr className="bg-white/5 sticky top-0 z-10">
                          <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {feature.group}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 text-foreground font-medium">{feature.name}</td>
                        <td className="text-center py-4 px-4">
                          {feature.tier1 === true ? (
                            <Check className="w-5 h-5 text-[var(--data-emerald)] mx-auto" />
                          ) : feature.tier1 === false ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-sm text-foreground">{feature.tier1}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4 bg-[var(--data-emerald)]/5">
                          {feature.tier2 === true ? (
                            <Check className="w-5 h-5 text-[var(--data-emerald)] mx-auto" />
                          ) : feature.tier2 === false ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-sm text-foreground">{feature.tier2}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {feature.tier3 === true ? (
                            <Check className="w-5 h-5 text-[var(--data-emerald)] mx-auto" />
                          ) : feature.tier3 === false ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-sm text-foreground">{feature.tier3}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {feature.tier4 === true ? (
                            <Check className="w-5 h-5 text-[var(--data-emerald)] mx-auto" />
                          ) : feature.tier4 === false ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-sm text-foreground">{feature.tier4}</span>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 px-6 bg-[var(--forest-canopy)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Built for organizations that need the highest standards of security, compliance, and scalability.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enterpriseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--data-emerald)]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Got questions? We have answers. If you cannot find what you are looking for, reach out to our support team.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group border border-border rounded-xl bg-card overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-foreground hover:bg-muted/50 transition-colors list-none">
                  {faq.question}
                  <span className="ml-4 flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center group-open:rotate-45 transition-transform">
                    <span className="block w-3 h-0.5 bg-foreground absolute" />
                    <span className="block w-0.5 h-3 bg-foreground" />
                  </span>
                </summary>
                <div className="px-5 pb-5 text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 p-8 rounded-2xl bg-muted/50 border border-border"
          >
            <h3 className="text-xl font-bold text-foreground mb-2">
              Need a personalized demo?
            </h3>
            <p className="text-muted-foreground mb-4">
              Book a call with our team for a walkthrough tailored to your use case.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/demo">
                <Button className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white rounded-full">
                  Book a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
