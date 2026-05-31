"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Shield, Eye, Lock } from "lucide-react";
import Image from "next/image";

export function TrustAndData() {
  const t = useTranslations("marketing");

  return (
    <section className="relative py-24 md:py-32 bg-[var(--forest-canopy)] overflow-hidden">
      {/* Background decorative image */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="/images/supply-chain-flow.jpg"
          alt=""
          fill
          className="object-cover"
        />
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--forest-canopy)] via-[var(--forest-canopy)]/95 to-[var(--forest-light)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
              Trust & Data
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-balance leading-[1.1]">
              {t("trustAndDataSection.headline")}
            </h2>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10">
              {t("trustAndDataSection.description")}
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[var(--forest-canopy)]" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {t("trustAndDataSection.goal.title")}
                </h3>
              </div>
              <p className="text-base text-white/70 leading-relaxed">
                {t("trustAndDataSection.goal.description")}
              </p>
            </div>
          </motion.div>

          {/* Right: Visual Cards */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-4">
              {[
                {
                  icon: Lock,
                  title: "Consent-based sharing",
                  description: "Producers control who sees their data",
                },
                {
                  icon: Eye,
                  title: "Full audit trail",
                  description: "Every access logged for compliance",
                },
                {
                  icon: Shield,
                  title: "Reusable records",
                  description: "Capture once, use across shipments",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 shadow-xl"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--forest-canopy)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-[var(--forest-canopy)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--forest-canopy)]">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
