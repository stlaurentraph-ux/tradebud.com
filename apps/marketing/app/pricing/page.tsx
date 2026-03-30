"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Building2, Shield, Zap, Users, Globe, Clock } from "lucide-react";
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
    price: "$0",
    period: "/month forever",
    description: "Free forever tier for smallholders and data creators building the global farm database.",
    features: [
      "Unlimited plot mappings",
      "Offline mobile app for enumerators",
      "GPS & polygon capture (4+ hectares)",
      "Ground-truth photo documentation",
      "Farmer data wallet for data control",
      "Free forever - no setup fees",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/get-started",
    highlighted: false,
    tier: "Tier 1",
  },
  {
    name: "Exporters & Cooperatives",
    price: "$0",
    period: "/month base",
    description: "Aggregate farmer data for free. Pro features and per-shipment fees apply.",
    features: [
      "Free unlimited farmer aggregation",
      "Pro Dashboard: $19/month (optional)",
      "Advanced yield-cap anti-laundering",
      "Automated batch management",
      "Basic EUDR reporting",
      "API access for integrations",
      "$0.15 per transaction processing",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/get-started",
    highlighted: true,
    badge: "Most Popular",
    tier: "Tier 2",
  },
  {
    name: "EU Importers & Roasters",
    price: "$19",
    period: "/month + per-shipment",
    description: "Mandatory 5-year EUDR data retention + transaction-based shipment fees.",
    features: [
      "$19/month data retention fee",
      "EUDR Shipment: $0.50 per DDS",
      "Premium ESG Shipment: $1.00 per DDS",
      "TRACES NT submission middleware",
      "Zero-Risk pre-flight checks",
      "Multi-supplier risk dashboard",
      "100% predictable, usage-based pricing",
      "Dedicated support",
    ],
    cta: "Request Demo",
    href: "#quote-form",
    highlighted: false,
    tier: "Tier 3",
  },
  {
    name: "Enterprise Brands & Sponsors",
    price: "$199",
    period: "/month + sponsorships",
    description: "Multi-tenant platform for large enterprises, ESG sponsors, and supply chain networks.",
    features: [
      "$199/month base platform fee",
      "$19/month per sponsored coop/exporter",
      "Standard or Premium per-shipment fees",
      "Multi-tenant sub-organization routing",
      "EcoVadis & Sustainalytics connectors",
      "Custom API integrations",
      "Advanced compliance workflows",
      "24/7 dedicated support team",
    ],
    cta: "Contact Sales",
    href: "#quote-form",
    highlighted: false,
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
  { name: "Cost Structure", tier1: "Free Forever", tier2: "$0/mo base", tier3: "$19/mo base", tier4: "$199/mo base" },
  { name: "Per-Shipment Fee", tier1: "N/A", tier2: "$0.15/tx", tier3: "$0.50-$1.00", tier4: "$0.50-$1.00" },
  { name: "Farmer Aggregation", tier1: "Unlimited", tier2: "Unlimited", tier3: "Unlimited", tier4: "Unlimited" },
  { name: "Plot Mapping & GPS", tier1: true, tier2: true, tier3: true, tier4: true },
  { name: "Polygon Capture (4+ ha)", tier1: true, tier2: true, tier3: true, tier4: true },
  { name: "Ground-Truth Photos", tier1: true, tier2: true, tier3: true, tier4: true },
  { name: "Offline Mobile App", tier1: true, tier2: true, tier3: true, tier4: true },
  { name: "Farmer Data Wallet", tier1: true, tier2: true, tier3: true, tier4: true },
  { name: "Pro Dashboard ($19/mo)", tier1: false, tier2: true, tier3: true, tier4: true },
  { name: "Yield-Cap Anti-Laundering", tier1: false, tier2: true, tier3: true, tier4: true },
  { name: "Batch Management", tier1: false, tier2: true, tier3: true, tier4: true },
  { name: "TRACES NT Middleware", tier1: false, tier2: false, tier3: true, tier4: true },
  { name: "Zero-Risk Pre-Flight", tier1: false, tier2: false, tier3: true, tier4: true },
  { name: "Multi-Supplier Dashboard", tier1: false, tier2: false, tier3: true, tier4: true },
  { name: "EUDR 5-Year Retention", tier1: false, tier2: false, tier3: true, tier4: true },
  { name: "Multi-Tenant Admin", tier1: false, tier2: false, tier3: false, tier4: true },
  { name: "EcoVadis Connectors", tier1: false, tier2: false, tier3: false, tier4: true },
  { name: "Custom Integrations", tier1: false, tier2: "API Access", tier3: "Premium", tier4: "Full" },
  { name: "Support Level", tier1: "Community", tier2: "Email", tier3: "Dedicated", tier4: "24/7 Dedicated" },
];

const faqs = [
  {
    question: "Why is Tracebud's pricing so different from competitors?",
    answer: "Traditional compliance platforms charge massive setup fees (€5,000+) and per-farmer monthly fees (€40-50), destroying adoption at smallholder level. Tracebud's transaction-based model scales predictably and ensures mass-market adoption—you only pay for what you actually process.",
  },
  {
    question: "What does '$0.15 per transaction' mean?",
    answer: "A transaction is one shipment or batch processed through our platform. This includes satellite deforestation checks, LLM document parsing, and TRACES NT API middleware. At scale, this becomes 100% cheaper than per-farmer subscription models.",
  },
  {
    question: "What's the difference between $0.50 and $1.00 per shipment?",
    answer: "$0.50 covers EUDR-compliant shipment processing and due diligence statements (DDS). $1.00 adds Premium ESG features including dynamic routing to Cool Farm Tool and OSSL for comprehensive E1-E5 ESG metrics and CSRD reporting.",
  },
  {
    question: "Do I have to pay for all four tiers?",
    answer: "No. Each organization chooses one tier based on their role: Farmers stay on Tier 1 (free), Exporters on Tier 2, Importers on Tier 3, and Enterprise brands/sponsors on Tier 4. You only pay for your tier.",
  },
  {
    question: "Can an Exporter sponsor cooperatives under Tier 4?",
    answer: "Yes. Large exporters can use Tier 4 ($199/mo) and sponsor farmer cooperatives at $19/month each. This ensures standardized data quality across their supply chain while cooperatives enjoy advanced features.",
  },
  {
    question: "What if my shipment volume is unpredictable?",
    answer: "That's the beauty of transaction-based pricing—your costs scale with actual usage. In high-volume months you pay more; in quiet months you pay less. No fixed overheads or dead-money subscriptions.",
  },
];

export default function PricingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    employees: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--data-emerald)]/20 text-[var(--data-emerald)] text-sm font-medium mb-6">
              <Clock className="w-4 h-4" />
              Start your free trial today
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-pretty">
              Choose the plan that fits your needs. Scale as you grow with no hidden fees or surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-background -mt-1">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 -mt-24">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 lg:p-8 flex flex-col ${
                  plan.highlighted
                    ? "bg-[var(--forest-canopy)] text-white ring-2 ring-[var(--data-emerald)] shadow-xl scale-[1.02] lg:scale-105"
                    : "bg-card border border-border shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--data-emerald)] text-[var(--forest-canopy)] text-sm font-bold">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className={`text-4xl lg:text-5xl font-bold ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? "text-white/70" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-[var(--data-emerald)]" : "text-[var(--data-emerald)]"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-foreground/80"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className={`w-full rounded-full font-bold text-base py-6 ${
                      plan.highlighted
                        ? "bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)]"
                        : "bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
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
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Tier 4: Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature.name} className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : ""}`}>
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
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Section with Quote Form */}
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
                <span className="text-[var(--data-emerald)] font-semibold text-lg">Enterprise</span>
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
