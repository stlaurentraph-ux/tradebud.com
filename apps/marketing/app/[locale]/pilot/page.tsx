"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Gift,
  MapPin,
  Tag,
  ShieldCheck,
  Sprout,
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

const pilotRoleKeys = ["producer", "cooperative", "exporter", "importer", "sponsor"] as const;
const eudrReadinessKeys = ["not_started", "in_progress", "advanced"] as const;
const startWindowKeys = ["0-30d", "30-90d", "90-180d", "flexible"] as const;
const benefitKeys = ["free", "mapping", "literacy", "pricing", "trust"] as const;
const includedKeys = ["onboarding", "mapping", "plotCapture", "batchTesting", "feedback"] as const;
const commitmentKeys = ["activeUse", "honestFeedback", "productImproving", "reviewCall"] as const;

const benefitIcons = {
  free: Gift,
  mapping: MapPin,
  literacy: Sprout,
  pricing: Tag,
  trust: ShieldCheck,
} as const;

const whoCards = [
  { key: "producer" as const, src: "/images/step-photos.jpg", objectPosition: "center 35%" },
  { key: "cooperative" as const, src: "/images/pilot/cooperatives.jpg", objectPosition: "center 40%" },
  { key: "exporter" as const, src: "/images/exporter-hero.jpg", objectPosition: "center center" },
  { key: "importer" as const, src: "/images/pilot/importers-corporate.jpg", objectPosition: "center 35%" },
  { key: "sponsor" as const, src: "/images/country-hero.jpg", objectPosition: "center center" },
];

export default function PilotPage() {
  const t = useTranslations("marketing.pilot");
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
      setErr(t("form.errors.roleRequired"));
      return;
    }
    if (!form.successCriteria.trim()) {
      setErr(t("form.errors.noteRequired"));
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
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? t("form.errors.submitFailed"));
      setOk(t("form.success"));
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
      setErr(error instanceof Error ? error.message : t("form.errors.unexpected"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans">
      <Header />

      <section className="relative overflow-hidden bg-[var(--forest-canopy)] pt-28">
        <div className="absolute inset-0">
          <Image
            src="/images/aerial-farm-jungle.png"
            alt={t("hero.imageAlt")}
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl pb-16 pt-8"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--data-emerald)]">
              <Calendar className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.1] text-white md:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
              {t("hero.description")}
            </p>
            <a href="#apply">
              <Button
                size="lg"
                className="rounded-full bg-[var(--data-emerald)] px-8 py-6 text-base font-bold text-[var(--forest-canopy)] hover:bg-emerald-400"
              >
                {t("hero.cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_480px]">
          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
                {t("benefits.eyebrow")}
              </p>
              <h2 className="mb-8 text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl">
                {t("benefits.title")}
              </h2>
              <ul className="space-y-4">
                {benefitKeys.map((key) => {
                  const Icon = benefitIcons[key];
                  return (
                    <li key={key} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--data-emerald)]/10">
                        <Icon className="h-4 w-4 text-[var(--data-emerald)]" />
                      </div>
                      <span className="pt-1.5 text-base leading-relaxed text-gray-700">
                        {t(`benefits.items.${key}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
                {t("whoShouldApply.eyebrow")}
              </p>
              <h2 className="mb-4 text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl">
                {t("whoShouldApply.title")}
              </h2>
              <p className="mb-6 text-gray-600">{t("whoShouldApply.description")}</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {whoCards.map((card) => {
                  const label = t(`whoShouldApply.cards.${card.key}`);
                  return (
                    <div key={card.key} className="group relative aspect-[3/2] overflow-hidden rounded-xl">
                      <Image
                        src={card.src}
                        alt={label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ objectPosition: card.objectPosition }}
                        sizes="(max-width: 1024px) 50vw, 400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/80 via-[var(--forest-canopy)]/20 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-sm font-bold text-white">{label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-gray-500">{t("whoShouldApply.footnote")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid gap-8 sm:grid-cols-2"
            >
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
                  {t("included.eyebrow")}
                </p>
                <h2 className="mb-5 text-xl font-bold text-[var(--forest-canopy)]">{t("included.title")}</h2>
                <ul className="space-y-3">
                  {includedKeys.map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--data-emerald)]" />
                      <span className="text-sm text-gray-600">{t(`included.items.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--forest-canopy)]/50">
                  {t("commitment.eyebrow")}
                </p>
                <h2 className="mb-5 text-xl font-bold text-[var(--forest-canopy)]">{t("commitment.title")}</h2>
                <ul className="space-y-3">
                  {commitmentKeys.map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-600">{t(`commitment.items.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-2xl bg-[var(--forest-canopy)]"
            >
              <div className="relative h-44 w-full">
                <Image
                  src="/images/gis-geolocation.jpg"
                  alt={t("whyJoin.imageAlt")}
                  fill
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--forest-canopy)]" />
              </div>
              <div className="relative z-10 -mt-8 p-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
                  {t("whyJoin.eyebrow")}
                </p>
                <h2 className="mb-4 text-xl font-bold text-white">{t("whyJoin.title")}</h2>
                <p className="text-sm leading-relaxed text-white/75">{t("whyJoin.description")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 rounded-2xl border border-gray-200 p-6"
            >
              <ShieldCheck className="mt-0.5 h-8 w-8 flex-shrink-0 text-[var(--data-emerald)]" />
              <div>
                <p className="mb-1 font-bold text-[var(--forest-canopy)]">{t("trust.title")}</p>
                <p className="text-sm leading-relaxed text-gray-600">{t("trust.description")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="pt-4 text-center lg:hidden"
            >
              <a href="#apply">
                <Button
                  size="lg"
                  className="rounded-full bg-[var(--data-emerald)] px-8 py-6 text-base font-bold text-[var(--forest-canopy)] hover:bg-emerald-400"
                >
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <p className="mt-3 text-sm text-gray-400">{t("mobileCta.footnote")}</p>
            </motion.div>
          </div>

          <div className="lg:sticky lg:top-24" id="apply">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="relative h-64 w-full sm:h-72">
                <Image
                  src="/images/inclusion-visual.jpg"
                  alt={t("form.farmerImageAlt")}
                  fill
                  className="object-cover object-[center_28%]"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
              </div>

              <div className="relative z-10 p-8">
                <h2 className="mb-1 text-xl font-bold text-[var(--forest-canopy)]">{t("form.title")}</h2>
                <p className="mb-7 text-sm text-gray-500">{t("form.subtitle")}</p>

                {ok ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">{ok}</p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="pilotRole">
                        {t("form.fields.role")} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.pilotRole || undefined}
                        onValueChange={(v) => setForm((f) => ({ ...f, pilotRole: v }))}
                      >
                        <SelectTrigger id="pilotRole" className="w-full">
                          <SelectValue placeholder={t("form.placeholders.role")} />
                        </SelectTrigger>
                        <SelectContent>
                          {pilotRoleKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                              {t(`form.roles.${key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="organizationName">
                        {t("form.fields.organizationName")} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="organizationName"
                        required
                        autoComplete="organization"
                        value={form.organizationName}
                        onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contactName">
                        {t("form.fields.contactName")} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        required
                        autoComplete="name"
                        value={form.contactName}
                        onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">
                        {t("form.fields.email")} <span className="text-red-500">*</span>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="country">{t("form.fields.country")}</Label>
                        <Input
                          id="country"
                          autoComplete="country-name"
                          value={form.country}
                          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="primaryCommodity">{t("form.fields.commodity")}</Label>
                        <Input
                          id="primaryCommodity"
                          placeholder={t("form.placeholders.commodity")}
                          value={form.primaryCommodity}
                          onChange={(e) => setForm((f) => ({ ...f, primaryCommodity: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="organizationScale">{t("form.fields.organizationScale")}</Label>
                      <Input
                        id="organizationScale"
                        placeholder={t("form.placeholders.organizationScale")}
                        value={form.organizationScale}
                        onChange={(e) => setForm((f) => ({ ...f, organizationScale: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="eudrReadiness">{t("form.fields.eudrReadiness")}</Label>
                      <Select
                        value={form.eudrReadiness || undefined}
                        onValueChange={(v) => setForm((f) => ({ ...f, eudrReadiness: v }))}
                      >
                        <SelectTrigger id="eudrReadiness" className="w-full">
                          <SelectValue placeholder={t("form.placeholders.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eudrReadinessKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                              {t(`form.eudrReadiness.${key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="earliestStart">{t("form.fields.earliestStart")}</Label>
                      <Select
                        value={form.earliestStart || undefined}
                        onValueChange={(v) => setForm((f) => ({ ...f, earliestStart: v }))}
                      >
                        <SelectTrigger id="earliestStart" className="w-full">
                          <SelectValue placeholder={t("form.placeholders.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {startWindowKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                              {t(`form.startWindows.${key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="successCriteria">
                        {t("form.fields.successCriteria")} <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="successCriteria"
                        required
                        rows={3}
                        placeholder={t("form.placeholders.successCriteria")}
                        value={form.successCriteria}
                        onChange={(e) => setForm((f) => ({ ...f, successCriteria: e.target.value }))}
                      />
                    </div>

                    {err && (
                      <p className="text-sm text-red-600" role="alert">
                        {err}
                      </p>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full rounded-full bg-[var(--forest-canopy)] py-6 font-bold text-white hover:bg-[var(--forest-light)]"
                    >
                      {submitting ? t("form.submitting") : t("form.submit")}
                    </Button>
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
