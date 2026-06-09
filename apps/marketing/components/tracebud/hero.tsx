"use client";

import { motion } from "framer-motion";
<<<<<<< HEAD
import { ArrowRight, Layers, Zap, Users, ShieldCheck, Link2, Zap as ZapIcon } from "lucide-react";
=======
import { ArrowRight } from "lucide-react";
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { useTranslations } from "next-intl";

export function Hero() {
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");

  return (
    <>
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Farmer in coffee field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.42fr)_minmax(0,0.58fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)] xl:gap-16">
            <motion.div
              className="min-w-0 lg:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-6 max-w-[44rem] text-pretty text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:max-w-none lg:text-5xl lg:leading-[1.08] xl:text-6xl xl:leading-tight">
                {t("hero.headline")}
              </h1>

              <p className="mb-3 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                {t("hero.subheadline")}
              </p>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                {t("hero.subheadlineSecondary")}
              </p>

              <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-8 py-6 text-base font-semibold text-[var(--forest-canopy)] hover:bg-white/90"
                  asChild
                >
                  <a href="#how-it-works">{t("hero.cta.primary")}</a>
                </Button>
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="rounded-full bg-[var(--data-emerald)] px-8 py-6 text-base font-semibold text-[var(--forest-canopy)] hover:bg-emerald-400"
                >
                  {t("hero.cta.secondary")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

<<<<<<< HEAD
              <p className="text-sm text-white/60">
                {t("hero.supportingText")}
              </p>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/10">
                {[
                  { label: "Works offline" },
                  { label: "20 min to map a farm" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--data-emerald)]" />
                    <span className="text-sm text-white/70 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
=======
              <p className="text-sm text-white/60">{t("hero.supportingText")}</p>
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
            </motion.div>

            <motion.div
              className="relative flex justify-center lg:justify-end lg:pl-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-[280px] md:w-[320px] lg:w-[250px] xl:w-[320px]">
                <Image
                  src="/images/farmer-app-homepage.png"
                  alt="Tracebud Farmer App interface"
                  width={320}
                  height={693}
                  className="h-auto w-full"
                />

                <div className="absolute -left-8 top-1/4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">{t("hero.trustStrip.offline")}</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="text-2xl font-bold text-[var(--forest-canopy)]">{t("hero.trustStrip.mapTime")}</div>
                  <div className="text-xs text-gray-500">{t("hero.trustStrip.mapTimeLabel")}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
<<<<<<< HEAD

      {/* Why Tracebud Section */}
      <section className="relative overflow-hidden bg-white py-24 md:py-32">
        {/* Full-bleed image on right half */}
        <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block">
          <Image
            src="/images/step-photos.jpg"
            alt="Farmer documenting coffee harvest"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="lg:max-w-[55%]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance leading-tight">
                {t("whyTracebudSection.headline")}
              </h2>
              <p className="text-base text-gray-500 leading-relaxed mb-10">
                {t("whyTracebudSection.intro")}
              </p>
            </motion.div>

            {/* Value pillars */}
            <div className="space-y-5 mb-14">
              {[
                {
                  icon: Layers,
                  titleKey: "whyTracebudSection.pillars.simple.title",
                  descriptionKey: "whyTracebudSection.pillars.simple.description",
                },
                {
                  icon: Zap,
                  titleKey: "whyTracebudSection.pillars.automated.title",
                  descriptionKey: "whyTracebudSection.pillars.automated.description",
                },
                {
                  icon: Users,
                  titleKey: "whyTracebudSection.pillars.inclusive.title",
                  descriptionKey: "whyTracebudSection.pillars.inclusive.description",
                },
              ].map((pillar, index) => (
                <motion.div
                  key={pillar.titleKey}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-5 items-start"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--forest-canopy)] flex items-center justify-center flex-shrink-0">
                    <pillar.icon className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--forest-canopy)] mb-0.5">{t(pillar.titleKey)}</h3>
                    <p className="text-gray-600 leading-relaxed">{t(pillar.descriptionKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Outcome pillars */}
            <div className="border-t border-gray-100 pt-10">
              <p className="text-xs font-semibold text-[var(--data-emerald)] tracking-widest uppercase mb-6">
                Why Tracebud
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  {
                    icon: ShieldCheck,
                    titleKey: "whyTracebudSection.outcomeSection.pillars.proofGaps.title",
                    descriptionKey: "whyTracebudSection.outcomeSection.pillars.proofGaps.description",
                  },
                  {
                    icon: Link2,
                    titleKey: "whyTracebudSection.outcomeSection.pillars.provenance.title",
                    descriptionKey: "whyTracebudSection.outcomeSection.pillars.provenance.description",
                  },
                  {
                    icon: ZapIcon,
                    titleKey: "whyTracebudSection.outcomeSection.pillars.handoff.title",
                    descriptionKey: "whyTracebudSection.outcomeSection.pillars.handoff.description",
                  },
                ].map((pillar, index) => (
                  <motion.div
                    key={pillar.titleKey}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-[var(--warm-stone)] rounded-2xl p-5"
                  >
                    <pillar.icon className="w-5 h-5 text-[var(--data-emerald)] mb-3" />
                    <h3 className="text-sm font-bold text-[var(--forest-canopy)] mb-1">{t(pillar.titleKey)}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{t(pillar.descriptionKey)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile image fallback */}
        <div className="lg:hidden mt-12 mx-6 relative aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src="/images/step-photos.jpg"
            alt="Farmer documenting coffee harvest"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative overflow-hidden bg-[var(--forest-canopy)] py-24 md:py-32">
        {/* Background image with strong overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/supply-chain-flow.jpg"
            alt="Aerial view of coffee plantation"
            fill
            className="object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t("howItWorksSection.headline")}
            </h2>
            <p className="text-white/60 text-lg">{t("howItWorksSection.subtitle")}</p>
          </motion.div>

          {/* Step connector — desktop only */}
          <div className="hidden lg:flex items-center mb-8 px-2">
            {["01", "02", "03", "04"].map((n, i) => (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="w-8 h-8 rounded-full bg-[var(--data-emerald)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[var(--forest-canopy)]">{n}</span>
                </div>
                {i < 3 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-[var(--data-emerald)] to-[var(--data-emerald)]/20 mx-1" />
                )}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              {
                number: "01",
                titleKey: "howItWorksSection.steps.step1.title",
                descriptionKey: "howItWorksSection.steps.step1.description",
              },
              {
                number: "02",
                titleKey: "howItWorksSection.steps.step2.title",
                descriptionKey: "howItWorksSection.steps.step2.description",
              },
              {
                number: "03",
                titleKey: "howItWorksSection.steps.step3.title",
                descriptionKey: "howItWorksSection.steps.step3.description",
              },
              {
                number: "04",
                titleKey: "howItWorksSection.steps.step4.title",
                descriptionKey: "howItWorksSection.steps.step4.description",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-[var(--forest-canopy)] p-8 flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="lg:hidden text-[var(--data-emerald)] text-xs font-bold tracking-widest uppercase">{item.number}</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{t(item.titleKey)}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{t(item.descriptionKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
=======
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
    </>
  );
}
