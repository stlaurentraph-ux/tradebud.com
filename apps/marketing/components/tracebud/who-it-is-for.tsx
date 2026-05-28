"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function WhoItIsFor() {
  const t = useTranslations("marketing");

  const personas = [
    { keyPrefix: "whoItIsForSection.personas.producers" },
    { keyPrefix: "whoItIsForSection.personas.cooperatives" },
    { keyPrefix: "whoItIsForSection.personas.exporters" },
    { keyPrefix: "whoItIsForSection.personas.buyers" },
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="max-w-3xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance">
            {t("whoItIsForSection.headline")}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            {t("whoItIsForSection.description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.keyPrefix}
              className="p-8 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-[var(--data-emerald)] transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">
                {t(`${persona.keyPrefix}.title`)}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {t(`${persona.keyPrefix}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
