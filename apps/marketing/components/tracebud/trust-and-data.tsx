"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function TrustAndData() {
  const t = useTranslations("marketing");

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
              {t("trustAndDataSection.headline")}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              {t("trustAndDataSection.description")}
            </p>

            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">
                  {t("trustAndDataSection.goal.title")}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {t("trustAndDataSection.goal.description")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
