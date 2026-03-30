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
    name: "Cooperative",
    price: "$99",
    period: "/month",
    description: "For cooperatives managing farmer networks and field data collection.",
    features: [
      "Up to 500 farmer profiles",
      "Offline mobile app for enumerators",
      "Plot mapping with GPS/polygon capture",
      "Ground-truth photo documentation",
      "Basic EUDR compliance reports",
      "Simplified declarations support",
      "Community support",
    ],
    cta: "Start Free Trial",
    href: "/get-started",
    highlighted: false,
  },
  {
    name: "Exporter",
    price: "$299",
    period: "/month",
    description: "For exporters needing full supply chain traceability and due diligence.",
    features: [
      "Unlimited farmer & supplier profiles",
      "Advanced plot verification & AI checks",
      "Deforestation risk monitoring",
      "Batch-level identity preservation",
      "Yield cap validation",
      "Full EUDR documentation suite",
      "API access for ERP integration",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/get-started",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Importer",
    price: "$599",
    period: "/month",
    description: "For EU importers requiring complete due diligence and TRACES NT submission.",
    features: [
      "Everything in Exporter",
      "Multi-supplier risk dashboard",
      "TRACES NT submission middleware",
      "Zero-Risk Pre-Flight checks",
      "Dedicated account manager",
      "ESG platform connectors",
      "Custom compliance workflows",
      "99.9% SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "#quote-form",
    highlighted: false,
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
  { name: "Farmer/Supplier Profiles", cooperative: "500", exporter: "Unlimited", importer: "Unlimited", enterprise: "Unlimited" },
  { name: "Offline Mobile App", cooperative: true, exporter: true, importer: true, enterprise: true },
  { name: "GPS Plot Mapping", cooperative: true, exporter: true, importer: true, enterprise: true },
  { name: "Polygon Capture (4+ ha)", cooperative: true, exporter: true, importer: true, enterprise: true },
  { name: "Ground-Truth Photos", cooperative: true, exporter: true, importer: true, enterprise: true },
  { name: "AI Deforestation Checks", cooperative: false, exporter: true, importer: true, enterprise: true },
  { name: "Batch Identity Preservation", cooperative: false, exporter: true, importer: true, enterprise: true },
  { name: "Yield Cap Validation", cooperative: false, exporter: true, importer: true, enterprise: true },
  { name: "TRACES NT Submission", cooperative: false, exporter: false, importer: true, enterprise: true },
  { name: "Zero-Risk Pre-Flight", cooperative: false, exporter: false, importer: true, enterprise: true },
  { name: "ESG Platform Connectors", cooperative: false, exporter: false, importer: true, enterprise: true },
  { name: "AgStack GeoID Integration", cooperative: false, exporter: false, importer: false, enterprise: true },
  { name: "Cool Farm Tool API", cooperative: false, exporter: false, importer: false, enterprise: true },
  { name: "Multi-Tenant Admin", cooperative: false, exporter: false, importer: false, enterprise: true },
  { name: "SSO / SAML", cooperative: false, exporter: false, importer: false, enterprise: true },
  { name: "SLA Guarantee", cooperative: false, exporter: false, importer: "99.9%", enterprise: "99.99%" },
  { name: "Support", cooperative: "Community", exporter: "Priority Email", importer: "Dedicated", enterprise: "24/7 Dedicated" },
];

const faqs = [
  {
    question: "What is the EUDR compliance deadline?",
    answer: "The EU Deforestation Regulation requires compliance by December 30, 2026 for large/medium enterprises and June 30, 2027 for micro/small enterprises. Tracebud helps you prepare well in advance.",
  },
  {
    question: "Can I switch plans as my supply chain grows?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. As you onboard more suppliers or expand to new commodities, simply upgrade and we will prorate your billing accordingly.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Cooperative and Exporter plans include a 14-day free trial with full access to all features including offline mobile apps and plot mapping. No credit card required to start.",
  },
  {
    question: "How does data retention work for EUDR?",
    answer: "EUDR mandates 5-year retention of all due diligence documentation. Tracebud automatically stores and secures all compliance data, polygon mappings, and audit trails for the required period.",
  },
  {
    question: "What commodities does Tracebud support?",
    answer: "Tracebud supports all EUDR-regulated commodities: coffee, cocoa, rubber, soy, and timber. Our schema is commodity-agnostic with full HS code and risk matrix mapping.",
  },
  {
    question: "Do you offer discounts for cooperatives or NGOs?",
    answer: "Yes, we offer special pricing for farmer cooperatives, registered nonprofits, NGOs, and development organizations. Contact our sales team for details.",
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
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Cooperative</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground bg-[var(--data-emerald)]/10 rounded-t-lg">Exporter</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Importer</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature.name} className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : ""}`}>
                    <td className="py-4 px-4 text-foreground font-medium">{feature.name}</td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.cooperative === "boolean" ? (
                        feature.cooperative ? (
                          <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-foreground/80 text-sm">{feature.cooperative}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4 bg-[var(--data-emerald)]/5">
                      {typeof feature.exporter === "boolean" ? (
                        feature.exporter ? (
                          <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-foreground/80 text-sm">{feature.exporter}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.importer === "boolean" ? (
                        feature.importer ? (
                          <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-foreground/80 text-sm">{feature.importer}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 mx-auto text-[var(--data-emerald)]" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-foreground/80 text-sm">{feature.enterprise}</span>
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
