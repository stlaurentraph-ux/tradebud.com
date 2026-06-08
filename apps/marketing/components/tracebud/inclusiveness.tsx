"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Inclusiveness() {
  const t = useTranslations("marketing");

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/inclusion-visual.jpg"
          alt="Farmer in the field"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[var(--forest-canopy)]/85" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-balance leading-tight">
            {t("inclusionSection.headline")}
          </h2>
          <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-10 max-w-3xl mx-auto">
            {t("inclusionSection.description")}
          </p>
          <p className="text-base font-semibold text-[var(--data-emerald)]">
            {t("inclusionSection.punchline")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
