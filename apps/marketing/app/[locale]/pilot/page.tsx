"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Gift,
  MapPin,
  Tag,
  ShieldCheck,
  Sprout,
  Building2,
  Ship,
  Coffee,
  ChevronRight,
} from "lucide-react";

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

const pilotRoles = [
  { value: "producer", label: "Producer or farmer group" },
  { value: "cooperative", label: "Cooperative" },
  { value: "exporter", label: "Exporter" },
  { value: "importer", label: "Importer or roaster" },
  { value: "other", label: "Other" },
] as const;

const eudrMaturity = [
  { value: "not_started", label: "Not started — need a clear path" },
  { value: "in_progress", label: "In progress — partial tools or data" },
  { value: "advanced", label: "Advanced — systems in place, tuning for EUDR" },
] as const;

const startWindows = [
  { value: "0-30d", label: "Within 30 days" },
  { value: "30-90d", label: "1–3 months" },
  { value: "90-180d", label: "3–6 months" },
  { value: "flexible", label: "Flexible — fit matters more than date" },
] as const;

const benefits = [
  { icon: Gift, text: "3 months free, or your first shipment free." },
  { icon: MapPin, text: "Free mapping of farmers and fields during the pilot." },
  { icon: Sprout, text: "Built for low digital literacy and self-serve onboarding." },
  { icon: Tag, text: "Lifelong preferential pricing for active early partners." },
  { icon: ShieldCheck, text: "Designed for traceability, consent, and EU data residency." },
];

const whoShouldApply = [
  { icon: Sprout, label: "Producers and farmer groups" },
  { icon: Building2, label: "Cooperatives" },
  { icon: Ship, label: "Exporters" },
  { icon: Coffee, label: "Importers and roasters" },
];

const whatsIncluded = [
  "Organisation onboarding.",
  "Producer and field mapping.",
  "Plot capture and evidence upload.",
  "Batch and shipment testing.",
  "Feedback sessions to improve the product fast.",
];

const whatWeAsk = [
  "Use the product actively during the pilot.",
  "Share honest feedback.",
  "Accept that the product is still being improved.",
  "Join at least one short review call or provide written feedback.",
];

export default function PilotPage() {
  const [form, setForm] = useState({
    pilotRole: "",
    organizationName: "",
    contactName: "",
    email: "",
    country: "",
    primaryCommodity: "",
    organizationScale: "",
    eudrReadiness: "",
    earliestStart: "",
    successCriteria: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilotRole) {
      setErr("Please select your role in the chain.");
      return;
    }
    if (!form.successCriteria.trim()) {
      setErr("Please add a short note on why you want to join.");
      return;
    }
    setSubmitting(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "pilot",
          sourcePage: "/pilot",
          name: form.contactName,
          email: form.email,
          company: form.organizationName,
          country: form.country || null,
          message: null,
          payload: form,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Could not submit application.");
      setOk("Application received. We will follow up by email.");
      setForm({
        pilotRole: "",
        organizationName: "",
        contactName: "",
        email: "",
        country: "",
        primaryCommodity: "",
        organizationScale: "",
        eudrReadiness: "",
        earliestStart: "",
        successCriteria: "",
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 overflow-hidden bg-[var(--forest-canopy)]">
        <div className="absolute inset-0">
          <Image
            src="/images/aerial-farm-jungle.png"
            alt="Aerial view of farm fields"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-end">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pb-16 pt-8"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)]/20 border border-[var(--data-emerald)]/30 text-[var(--data-emerald)] px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
              <Calendar className="w-3.5 h-3.5" />
              Pilot open until 30 September 2026
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-[1.1]">
              Join the Tracebud Pilot
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl mb-10">
              Help us build a fully transparent, EUDR-ready coffee supply chain. We are inviting a small group of producers, cooperatives, exporters, and importers to test our tools and traceability workflows.
            </p>
            <a href="#apply">
              <Button
                size="lg"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 py-6 text-base rounded-full"
              >
                Apply to join the pilot
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </motion.div>

          {/* Right: farmer image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="relative h-[420px] w-full rounded-t-2xl overflow-hidden">
              <Image
                src="/images/farmer-hero.jpg"
                alt="Farmer using Tracebud in the field"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)] via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content + form side by side */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-[1fr_480px] gap-16 items-start">

          {/* Left column — all content sections */}
          <div className="space-y-16">

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-[var(--data-emerald)] tracking-widest uppercase mb-4">What you get</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-8">
                Top benefits
              </h2>
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b.text} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4 text-[var(--data-emerald)]" />
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed pt-1.5">{b.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Image strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { src: "/images/feature-offline-mapping.jpg", alt: "Offline field mapping" },
                { src: "/images/step-map-plot.jpg", alt: "Mapping a farm plot" },
                { src: "/images/feature-photo-vault.jpg", alt: "Photo evidence capture" },
              ].map((img) => (
                <div key={img.src} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </div>
              ))}
            </motion.div>

            {/* Who should apply */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-[var(--data-emerald)] tracking-widest uppercase mb-4">Who we want</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
                Who should apply
              </h2>
              <p className="text-gray-600 mb-6">We want a balanced group across the chain.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { src: "/images/farmer-hero.jpg", label: "Producers & farmer groups" },
                  { src: "/images/country-hero.jpg", label: "Cooperatives" },
                  { src: "/images/exporter-hero.jpg", label: "Exporters" },
                  { src: "/images/supply-chain-flow.jpg", label: "Importers & roasters" },
                ].map((card) => (
                  <div key={card.label} className="relative aspect-[3/2] rounded-xl overflow-hidden group">
                    <Image src={card.src} alt={card.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/80 via-[var(--forest-canopy)]/20 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-sm font-bold text-white">{card.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                If you can involve more than one role in the same chain, your application is especially valuable.
              </p>
            </motion.div>

            {/* What's included + what we ask — two columns */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid sm:grid-cols-2 gap-8"
            >
              <div>
                <p className="text-xs font-semibold text-[var(--data-emerald)] tracking-widest uppercase mb-4">Scope</p>
                <h2 className="text-xl font-bold text-[var(--forest-canopy)] mb-5">{"What's included"}</h2>
                <ul className="space-y-3">
                  {whatsIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[var(--data-emerald)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--forest-canopy)]/50 tracking-widest uppercase mb-4">Commitment</p>
                <h2 className="text-xl font-bold text-[var(--forest-canopy)] mb-5">What we ask</h2>
                <ul className="space-y-3">
                  {whatWeAsk.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Why join */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[var(--forest-canopy)] rounded-2xl overflow-hidden"
            >
              <div className="relative h-44 w-full">
                <Image
                  src="/images/gis-geolocation.jpg"
                  alt="Aerial farm fields"
                  fill
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--forest-canopy)]" />
              </div>
              <div className="p-8 -mt-8 relative z-10">
                <p className="text-xs font-semibold text-[var(--data-emerald)] tracking-widest uppercase mb-3">Why now</p>
                <h2 className="text-xl font-bold text-white mb-4">Why join</h2>
                <p className="text-white/75 leading-relaxed text-sm">
                  This pilot is not just a trial. It is a chance to shape a product built for real supply chains, while getting early access, lower risk, and better commercial terms later. Pilot projects work best when both sides are clear about scope, timing, and expectations.
                </p>
              </div>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 p-6 border border-gray-200 rounded-2xl"
            >
              <ShieldCheck className="w-8 h-8 text-[var(--data-emerald)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--forest-canopy)] mb-1">Trust and compliance</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tracebud is built with EU data residency, consent-based access, audit logs, and immutable compliance packages for shipments.
                </p>
              </div>
            </motion.div>

          </div>

          {/* Right column — sticky form */}
          <div className="lg:sticky lg:top-24" id="apply">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden"
            >
              {/* Farmer image header */}
              <div className="relative h-52 w-full">
                <Image
                  src="/images/inclusion-visual.jpg"
                  alt="Farmer using Tracebud in the field"
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              </div>

              <div className="p-8 -mt-6 relative z-10">
              <h2 className="text-xl font-bold text-[var(--forest-canopy)] mb-1">Apply to join the pilot</h2>
              <p className="text-sm text-gray-500 mb-7">
                Submitting this form creates no financial obligation.
              </p>

              {ok ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-emerald-800 font-medium">{ok}</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">

                  <div className="space-y-1.5">
                    <Label htmlFor="pilotRole">Role in the chain <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.pilotRole || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, pilotRole: v }))}
                    >
                      <SelectTrigger id="pilotRole" className="w-full">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {pilotRoles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="organizationName">Organisation name <span className="text-red-500">*</span></Label>
                    <Input
                      id="organizationName"
                      required
                      autoComplete="organization"
                      value={form.organizationName}
                      onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactName">Your name <span className="text-red-500">*</span></Label>
                    <Input
                      id="contactName"
                      required
                      autoComplete="name"
                      value={form.contactName}
                      onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        autoComplete="country-name"
                        value={form.country}
                        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="primaryCommodity">Commodity</Label>
                      <Input
                        id="primaryCommodity"
                        placeholder="e.g. coffee"
                        value={form.primaryCommodity}
                        onChange={(e) => setForm((f) => ({ ...f, primaryCommodity: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="organizationScale">Approximate number of producers or shipments</Label>
                    <Input
                      id="organizationScale"
                      placeholder="e.g. ~120 farmers, or 30 shipments/year"
                      value={form.organizationScale}
                      onChange={(e) => setForm((f) => ({ ...f, organizationScale: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="eudrReadiness">Where you are with EUDR today</Label>
                    <Select
                      value={form.eudrReadiness || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, eudrReadiness: v }))}
                    >
                      <SelectTrigger id="eudrReadiness" className="w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {eudrMaturity.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="earliestStart">Earliest window to start</Label>
                    <Select
                      value={form.earliestStart || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, earliestStart: v }))}
                    >
                      <SelectTrigger id="earliestStart" className="w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {startWindows.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="successCriteria">
                      Short note on why you want to join <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="successCriteria"
                      required
                      rows={3}
                      placeholder="What you hope to get out of the pilot."
                      value={form.successCriteria}
                      onChange={(e) => setForm((f) => ({ ...f, successCriteria: e.target.value }))}
                    />
                  </div>

                  {err && (
                    <p className="text-sm text-red-600" role="alert">{err}</p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full rounded-full bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold py-6"
                  >
                    {submitting ? "Sending…" : "Submit application"}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    No financial obligation.{" "}
                    <Link href="/get-started" className="text-[var(--forest-canopy)] underline-offset-2 hover:underline">
                      Create a free account instead
                    </Link>
                  </p>
                </form>
              )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
