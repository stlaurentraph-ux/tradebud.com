"use client";

import { motion } from "framer-motion";
import { Play, MapPin, FileCheck, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductDemo() {
  const features = [
    {
      icon: MapPin,
      title: "Plot Registration",
      description: "GPS boundary capture in 60 seconds. Offline-first mapping for areas without connectivity.",
    },
    {
      icon: FileCheck,
      title: "Compliance Engine",
      description: "Automated Due Diligence Statements. Deforestation baseline checks against 2020 satellite data.",
    },
    {
      icon: Zap,
      title: "Document Vault",
      description: "Cryptographically secure storage for certificates, photos, and compliance evidence.",
    },
    {
      icon: Lock,
      title: "Audit Trail",
      description: "Complete traceability from farm to port. TRACES NT ready, GS1 EPCIS compatible.",
    },
  ];

  return (
    <section className="py-20 md:py-32 px-6 bg-gradient-to-b from-white to-[var(--data-emerald)]/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-4">
            Product Features
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--forest-canopy)] mb-6 tracking-tight">
            Built for Real-World Compliance
          </h2>
          <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Every feature designed by compliance experts who&apos;ve worked in supply chains for years.
          </p>
        </motion.div>

        {/* Video Demo Section */}
        <motion.div
          className="mb-20 md:mb-28"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--forest-canopy)] to-[var(--data-emerald)]/80 p-1">
            <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center relative group cursor-pointer">
              {/* Placeholder video background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--forest-canopy)]/20 to-[var(--data-emerald)]/20" />
              
              {/* Demo content placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 md:p-12 text-center">
                <div className="mb-6">
                  <p className="text-sm md:text-base text-white/70 mb-4">Live Product Demo</p>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4">
                    From Plot Registration to Export Approval
                  </h3>
                  <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                    Watch how a farmer registers their plot, gets compliance verification, and connects to exporters—all in under 3 minutes.
                  </p>
                </div>
              </div>

              {/* Play button overlay */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--data-emerald)] hover:bg-emerald-400 shadow-2xl transition-all group-hover:scale-110"
                  aria-label="Play product demo video"
                >
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-[var(--forest-canopy)] ml-1" fill="currentColor" />
                </button>
              </motion.div>
            </div>

          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-[var(--data-emerald)]/50 hover:shadow-lg transition-all"
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--data-emerald)]/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[var(--data-emerald)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 md:mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-gray-700 text-lg md:text-xl mb-6">
            Ready to see it in action?
          </p>
          <a href="/get-started">
            <Button className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 md:px-12 py-4 md:py-5 text-base md:text-lg rounded-full shadow-xl">
              Start Your Free Assessment
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
