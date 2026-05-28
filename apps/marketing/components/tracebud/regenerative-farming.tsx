"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sprout } from "lucide-react";

export function RegenerativeFarming() {
  const t = useTranslations("marketing");

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sprout className="w-6 h-6 text-[var(--data-emerald)]" />
              <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase">
                {t("regenerativeFarmingSection.label")}
              </p>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
              {t("regenerativeFarmingSection.headline")}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              {t("regenerativeFarmingSection.description")}
            </p>

            <div className="space-y-6 pt-8 border-t border-gray-200">
              <p className="text-base text-gray-600 leading-relaxed">
                {t("regenerativeFarmingSection.benefit")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
