"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function Problem() {
  const t = useTranslations("marketing");

  return (
    <section className="py-20 md:py-24 bg-[var(--warm-stone)]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--forest-canopy)] mb-6 text-balance leading-tight">
            {t("problemSection.headline")}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            {t("problemSection.description")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
