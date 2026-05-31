"use client";

import { motion } from "framer-motion";
import { Wifi, Users, Lock, FileText, Database, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
    <section className="relative py-24 md:py-32 bg-[var(--warm-stone)] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03]">
        <div className="absolute inset-0 bg-[var(--forest-canopy)]" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
              Real-world ready
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance leading-[1.1]">
              {t("builtForRealitiesSection.headline")}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-4">
              {t("builtForRealitiesSection.description")}
            </p>
            <p className="text-base font-semibold text-[var(--forest-canopy)] mb-10">
              {t("builtForRealitiesSection.thatMeans")}
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.keyPrefix}
                  className="group"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--forest-canopy)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <feature.icon className="w-5 h-5 text-[var(--data-emerald)]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--forest-canopy)] mb-1">
                        {t(`${feature.keyPrefix}.title`)}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {t(`${feature.keyPrefix}.description`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/step-photos.jpg"
                alt="Farmer using Tracebud mobile app in the field"
                fill
                className="object-cover"
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/40 via-transparent to-transparent" />
            </div>
            
            {/* Floating stat card */}
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                  <Wifi className="w-7 h-7 text-[var(--data-emerald)]" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-[var(--forest-canopy)]">100%</div>
                  <div className="text-sm text-gray-500">Offline capable</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
