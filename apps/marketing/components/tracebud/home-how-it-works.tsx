"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

const STEPS = ["step1", "step2", "step3", "step4"] as const;

export function HomeHowItWorks() {
  const t = useTranslations("marketing");

  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-[var(--forest-canopy)] py-24 md:py-32">
      <div className="absolute inset-0">
        <Image
          src="/images/supply-chain-flow.jpg"
          alt="Aerial view of coffee plantation"
          fill
          className="object-cover opacity-20"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {t("howItWorksSection.headline")}
          </h2>
          <p className="text-lg text-white/60">{t("howItWorksSection.subtitle")}</p>
        </motion.div>

        <div className="mb-8 hidden items-center px-2 lg:flex">
          {["01", "02", "03", "04"].map((n, i) => (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--data-emerald)]">
                <span className="text-[10px] font-bold text-[var(--forest-canopy)]">{n}</span>
              </div>
              {i < 3 && (
                <div className="mx-1 h-px flex-1 bg-gradient-to-r from-[var(--data-emerald)] to-[var(--data-emerald)]/20" />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((stepKey, index) => (
            <motion.div
              key={stepKey}
              className="flex flex-col gap-4 bg-[var(--forest-canopy)] p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)] lg:hidden">
                {t(`howItWorksSection.steps.${stepKey}.number`)}
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  {t(`howItWorksSection.steps.${stepKey}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {t(`howItWorksSection.steps.${stepKey}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
