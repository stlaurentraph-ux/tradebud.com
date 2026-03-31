"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Building2, Shield, Zap, Users, Globe } from "lucide-react";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

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
    cta: "Get Started Free",
    href: "/get-started",
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
    cta: "Start Free",
    href: "/get-started",
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
    cta: "Request Demo",
    href: "#quote-form",
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
    href: "#quote-form",
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    employees: "",
    tier: "",
    commodity: "",
    shipments: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const plan = new URLSearchParams(window.location.search).get("plan");
    if (plan) {
      setFormData((prev) => ({ ...prev, tier: plan }));
      document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handlePlanCta = (planTier?: string) => {
    if (planTier) {
      setFormData((prev) => ({ ...prev, tier: planTier }));
    }
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-[var(--forest-canopy)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
            ⚠️ EUDR deadline: <strong>Dec 30, 2026</strong> (large) · <strong>Jun 30, 2027</strong> (small)
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

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-background -mt-1">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-24">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-card p-6 h-full"
              >
                <div className="flex flex-col h-full">
                  {/** Enterprise pricing bands in Tier 2/3 should route CTA to sales. */}
                  {(() => {
                    const isEnterprise =
                      (plan.tier === "Tier 2" && exporterBand === "Enterprise") ||
                      (plan.tier === "Tier 3" && importerBand === "Enterprise");
                    return (
                      <>
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
                    {plan.href === "#quote-form" || isEnterprise ? (
                      <Button
                        onClick={() => handlePlanCta(plan.tier === "Tier 3" ? "tier3" : plan.tier === "Tier 4" ? "tier4" : undefined)}
                        className="w-full rounded-full font-bold text-base py-6 bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                      >
                        {isEnterprise ? "Contact Sales" : plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Link href={isEnterprise ? "#quote-form" : plan.href}>
                        <Button
                          className="w-full rounded-full font-bold text-base py-6 bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                        >
                          {isEnterprise ? "Contact Sales" : plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
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
                {(() => {
                  let lastGroup = "";
                  return comparisonFeatures.map((feature) => {
                    const showHeader = feature.group !== lastGroup;
                    lastGroup = feature.group;
                    return (
                      <Fragment key={feature.name}>
                        {showHeader && (
                          <tr className="bg-white/5 sticky top-0 z-10">
                            <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {feature.group}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-border/50">
                          <td className="py-4 px-4 text-foreground font-medium">{feature.name}</td>
                          <td className="text-center py-4 px-4">
                            {typeof feature.tier1 === "boolean" ? (
                              feature.tier1 ? (
                                <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              <span className="text-foreground/80 text-sm">{feature.tier1}</span>
                            )}
                          </td>
                          <td className="text-center py-4 px-4 bg-[var(--data-emerald)]/5">
                            {typeof feature.tier2 === "boolean" ? (
                              feature.tier2 ? (
                                <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              <span className="text-foreground/80 text-sm">{feature.tier2}</span>
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {typeof feature.tier3 === "boolean" ? (
                              feature.tier3 ? (
                                <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              <span className="text-foreground/80 text-sm">{feature.tier3}</span>
                            )}
                          </td>
                          <td className="text-center py-4 px-4">
                            {typeof feature.tier4 === "boolean" ? (
                              feature.tier4 ? (
                                <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              <span className="text-foreground/80 text-sm">{feature.tier4}</span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Sponsorship Section with Quote Form */}
      <section id="quote-form" className="py-20 px-6 bg-[var(--forest-canopy)] scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-8 h-8 text-[var(--data-emerald)]" />
                <span className="text-[var(--data-emerald)] font-semibold text-lg">Network Sponsors</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Need a Custom Solution?
              </h2>
              <p className="text-lg text-white/80 mb-10">
                For large organizations, governments, and complex supply chains, we offer tailored solutions with dedicated support and custom integrations.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {enterpriseFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--data-emerald)]/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[var(--data-emerald)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                        <p className="text-sm text-white/70">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 lg:p-8 shadow-2xl"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-[var(--data-emerald)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Thank You!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We have received your request. Our team will reach out within 24 hours to discuss your needs.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="rounded-full"
                  >
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Get a Personalised Quote
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Tell us about your requirements and we will create a custom package for you.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="Acme Inc."
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          required
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Your Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executive">Executive / C-Level</SelectItem>
                            <SelectItem value="director">Director / VP</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="specialist">Specialist / Analyst</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employees">Company Size</Label>
                      <Select
                        value={formData.employees}
                        onValueChange={(value) => setFormData({ ...formData, employees: value })}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Number of employees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                          <SelectItem value="1000+">1,000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Plan of Interest</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tier2">Exporters & Cooperatives (Tier 2)</SelectItem>
                          <SelectItem value="tier3">EU Importers & Roasters (Tier 3)</SelectItem>
                          <SelectItem value="tier4">Network Sponsors (Tier 4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commodity">Primary Commodity</Label>
                      <Select
                        value={formData.commodity}
                        onValueChange={(value) => setFormData({ ...formData, commodity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coffee">Coffee</SelectItem>
                          <SelectItem value="cocoa">Cocoa</SelectItem>
                          <SelectItem value="rubber">Rubber</SelectItem>
                          <SelectItem value="soy">Soy</SelectItem>
                          <SelectItem value="timber">Timber</SelectItem>
                          <SelectItem value="multiple">Multiple commodities</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipments">Approximate Annual Shipments</Label>
                      <Select
                        value={formData.shipments}
                        onValueChange={(value) => setFormData({ ...formData, shipments: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipment volume" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lt10">Fewer than 10</SelectItem>
                          <SelectItem value="10-50">10 - 50</SelectItem>
                          <SelectItem value="50-200">50 - 200</SelectItem>
                          <SelectItem value="200+">200+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Tell us about your needs</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your supply chain, current challenges, and what you are looking to achieve..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="rounded-lg resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold text-base py-6 rounded-full"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        <>
                          Get Your Custom Quote
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our Privacy Policy and Terms of Service.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
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
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our team is here to help you find the perfect solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-full"
              >
                View Documentation
              </Button>
              <Link href="#quote-form">
                <Button className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white rounded-full">
                  Talk to Sales
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
