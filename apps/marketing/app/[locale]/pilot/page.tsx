"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, ClipboardList, Users } from "lucide-react";

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
  { value: "cooperative", label: "Cooperative or producer group (Tier 2 target)" },
  { value: "buyer", label: "Buyer / importer (Tier 3 target)" },
  { value: "other", label: "Other (exporter, NGO, advisor, …)" },
] as const;

const eudrMaturity = [
  { value: "", label: "Select…" },
  { value: "not_started", label: "Not started — need a clear path" },
  { value: "in_progress", label: "In progress — partial tools or data" },
  { value: "advanced", label: "Advanced — systems in place; tuning for EUDR" },
] as const;

const startWindows = [
  { value: "", label: "Select…" },
  { value: "0-30d", label: "Within 30 days" },
  { value: "30-90d", label: "1–3 months" },
  { value: "90-180d", label: "3–6 months" },
  { value: "flexible", label: "Flexible — fit matters more than date" },
] as const;

export default function PilotPage() {
  const [form, setForm] = useState({
    pilotRole: "",
    organizationName: "",
    contactName: "",
    title: "",
    email: "",
    phone: "",
    country: "",
    primaryCommodity: "",
    organizationScale: "",
    eudrReadiness: "",
    earliestStart: "",
    successCriteria: "",
    additionalNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pilot program | Tracebud";
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilotRole) {
      setErr("Please select how you would participate in the pilot.");
      return;
    }
    if (!form.successCriteria.trim()) {
      setErr("Please describe what success would look like for your organization.");
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
          phone: form.phone || null,
          country: form.country || null,
          message: null,
          payload: form,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Could not submit application.");
      }
      setOk("Thanks — we received your pilot interest. We will follow up by email.");
      setForm({
        pilotRole: "",
        organizationName: "",
        contactName: "",
        title: "",
        email: "",
        phone: "",
        country: "",
        primaryCommodity: "",
        organizationScale: "",
        eudrReadiness: "",
        earliestStart: "",
        successCriteria: "",
        additionalNotes: "",
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-28 pb-12 px-6 bg-gradient-to-b from-[var(--forest-canopy)]/5 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--mountain-clay)]/15 text-[var(--forest-canopy)] px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Calendar className="w-4 h-4" />
            <span>Limited pilot — cooperative + buyer shaped</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Apply for the Tracebud pilot
          </h1>
          <p className="text-lg text-foreground/75 leading-relaxed">
            We are assembling a small, supported cohort to validate field-to-filing workflows under EUDR.
            Tell us who you are and what &ldquo;success&rdquo; means for your organization — this form is
            separate from our general contact flows.
          </p>
        </div>
      </section>

      <section className="pb-6 px-6">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4 mb-12">
          <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
            <Users className="w-8 h-8 text-[var(--data-emerald)] shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Producer side</p>
              <p className="text-xs text-foreground/70">
                Cooperatives ready to run real plots and batches with field + office users.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
            <ClipboardList className="w-8 h-8 text-[var(--data-emerald)] shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Buyer side</p>
              <p className="text-xs text-foreground/70">
                Importers who need upstream visibility and repeatable due diligence evidence.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3 sm:col-span-1">
            <CheckCircle2 className="w-8 h-8 text-[var(--data-emerald)] shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Outcome-led</p>
              <p className="text-xs text-foreground/70">
                Your success criteria drive how we prioritize onboarding and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6" id="apply">
        <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card shadow-sm p-6 md:p-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Pilot application</h2>
          <p className="text-sm text-foreground/70 mb-8">
            Fields marked <span className="text-red-600">*</span> are required.
          </p>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pilotRole">
                Your role <span className="text-red-600">*</span>
              </Label>
              <Select
                value={form.pilotRole || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, pilotRole: v }))}
              >
                <SelectTrigger id="pilotRole" className="w-full">
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {pilotRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="organizationName"
                required
                autoComplete="organization"
                value={form.organizationName}
                onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Your name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="contactName"
                  required
                  autoComplete="name"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  autoComplete="organization-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Work email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country / region</Label>
                <Input
                  id="country"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCommodity">Primary commodity</Label>
              <Input
                id="primaryCommodity"
                placeholder="e.g. coffee, cocoa"
                value={form.primaryCommodity}
                onChange={(e) => setForm((f) => ({ ...f, primaryCommodity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationScale">Approximate scale</Label>
              <Textarea
                id="organizationScale"
                rows={2}
                placeholder="e.g. ~120 member farmers; or annual import volume band; or hectares under management"
                value={form.organizationScale}
                onChange={(e) => setForm((f) => ({ ...f, organizationScale: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eudrReadiness">Where you are with EUDR today</Label>
              <Select
                value={form.eudrReadiness || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, eudrReadiness: v }))}
              >
                <SelectTrigger id="eudrReadiness" className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {eudrMaturity.filter((o) => o.value !== "").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="earliestStart">Earliest window to start</Label>
              <Select
                value={form.earliestStart || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, earliestStart: v }))}
              >
                <SelectTrigger id="earliestStart" className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {startWindows.filter((o) => o.value !== "").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successCriteria">
                What would make this pilot a success for you? <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="successCriteria"
                required
                rows={4}
                placeholder="Concrete outcomes or metrics you need (e.g. time to DDS, trace coverage, audit readiness)."
                value={form.successCriteria}
                onChange={(e) => setForm((f) => ({ ...f, successCriteria: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Anything else we should know?</Label>
              <Textarea
                id="additionalNotes"
                rows={3}
                value={form.additionalNotes}
                onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
              />
            </div>

            {err ? (
              <p className="text-sm text-red-600" role="alert">
                {err}
              </p>
            ) : null}
            {ok ? (
              <p className="text-sm text-emerald-700" role="status">
                {ok}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Submit pilot interest"}
            </Button>
          </form>

          <p className="text-xs text-foreground/60 mt-6 text-center">
            Want to start immediately instead?{" "}
            <Link href="/get-started" className="text-[var(--forest-canopy)] font-medium underline-offset-2 hover:underline">
              Create your free account
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
