"use client";

import { motion } from "framer-motion";
import { Layers, Zap, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function HomeProblemSection() {
  const t = useTranslations("marketing");

  const pillars = [
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
  ] as const;

  return (
    <section id="why-tracebud" className="relative scroll-mt-20 overflow-hidden bg-white py-24 md:py-32">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
        <Image
          src="/images/inclusion-visual.jpg"
          alt="Smallholder farmer using Tracebud on a smartphone"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="lg:max-w-[55%]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--data-emerald)]">
              {t("whyTracebudSection.eyebrow")}
            </p>
            <h2 className="mb-8 text-balance text-3xl font-bold leading-tight text-[var(--forest-canopy)] md:text-4xl lg:text-5xl">
              {t("whyTracebudSection.headline")}
            </h2>
            <p className="mb-12 text-lg leading-relaxed text-gray-600 md:text-xl">
              {t("whyTracebudSection.description")}
            </p>
          </motion.div>

          <div className="space-y-5">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.titleKey}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-5"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--forest-canopy)]">
                  <pillar.icon className="h-5 w-5 text-[var(--data-emerald)]" />
                </div>
                <div>
                  <h3 className="mb-0.5 text-base font-bold text-[var(--forest-canopy)]">{t(pillar.titleKey)}</h3>
                  <p className="leading-relaxed text-gray-600">{t(pillar.descriptionKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-6 mt-12 aspect-[4/3] overflow-hidden rounded-2xl lg:hidden">
        <Image
          src="/images/inclusion-visual.jpg"
          alt="Smallholder farmer using Tracebud on a smartphone"
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}
