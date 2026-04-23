"use client";

import { motion } from "framer-motion";
import { MapPin, FileCheck, Zap, Lock } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Plot Registration",
    description: "GPS boundary capture in 60 seconds. Offline-first.",
  },
  {
    icon: FileCheck,
    title: "Compliance Engine",
    description: "Automated DDS. Deforestation checks against 2020 baseline.",
  },
  {
    icon: Zap,
    title: "Document Vault",
    description: "Secure storage for certificates, photos, evidence.",
  },
  {
    icon: Lock,
    title: "Audit Trail",
    description: "Full traceability. TRACES NT ready. GS1 EPCIS compatible.",
  },
];

export function ProductDemo() {
  return (
    <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[var(--data-emerald)]/5">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-3">
            What You Get
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--forest-canopy)] mb-4 tracking-tight">
            Built for Real-World Compliance
          </h2>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 hover:border-[var(--data-emerald)]/50 hover:shadow-md transition-all"
                whileHover={{ y: -3 }}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[var(--data-emerald)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--forest-canopy)] mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
