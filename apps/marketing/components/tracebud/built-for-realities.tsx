"use client";

import { motion } from "framer-motion";
import { Wifi, Users, Lock, FileText, Database, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

export function BuiltForRealities() {
  const t = useTranslations("marketing");

  const features = [
    {
      icon: Wifi,
      keyPrefix: "builtForRealitiesSection.features.offline",
    },
    {
      icon: Users,
      keyPrefix: "builtForRealitiesSection.features.roleBasedAccess",
    },
    {
      icon: Lock,
      keyPrefix: "builtForRealitiesSection.features.consentBased",
    },
    {
      icon: FileText,
      keyPrefix: "builtForRealitiesSection.features.auditLogs",
    },
    {
      icon: Database,
      keyPrefix: "builtForRealitiesSection.features.reusableData",
    },
    {
      icon: Upload,
      keyPrefix: "builtForRealitiesSection.features.csvUpload",
    },
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
            {t("builtForRealitiesSection.headline")}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
            {t("builtForRealitiesSection.description")}
          </p>
          <p className="text-base font-semibold text-[var(--forest-canopy)] mb-8">
            {t("builtForRealitiesSection.thatMeans")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.keyPrefix}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--forest-canopy)] flex items-center justify-center flex-shrink-0 mt-1">
                <feature.icon className="w-5 h-5 text-[var(--data-emerald)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--forest-canopy)]">
                  {t(`${feature.keyPrefix}.title`)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t(`${feature.keyPrefix}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
