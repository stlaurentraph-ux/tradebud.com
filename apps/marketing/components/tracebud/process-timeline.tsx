'use client';

import { motion } from 'framer-motion';
import { Smartphone, Truck, Building, ArrowDown, ChevronRight, CheckCircle2, FileCheck } from 'lucide-react';

export function ProcessTimeline() {
  const steps = [
    {
      step: "01",
      icon: Smartphone,
      label: "Field Operators",
      bullets: ["Download the app", "Geolocate plots", "Register harvest", "Create Trade ID"],
      color: "from-emerald-500 to-emerald-600"
    },
    {
      step: "02",
      icon: Truck,
      label: "Exporters",
      bullets: ["Collect Trade IDs", "Aggregate plots", "Generate shipment", "Attach compliance"],
      color: "from-emerald-600 to-teal-600"
    },
    {
      step: "03",
      icon: Building,
      label: "Importers",
      bullets: ["Receive shipment", "Access full data", "Report to EU", "Stay audit-ready"],
      color: "from-teal-600 to-cyan-600"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 px-4 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--forest-canopy)]">
            A common path from field to EU readiness
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto mt-4 leading-relaxed">
            Many workflows start here—but Tracebud is also a{" "}
            <span className="font-semibold text-[var(--forest-canopy)]">network</span>: brands, cooperatives, exporters, and
            farmers can each initiate mapping, diligence, or data requests. The steps below are one clear route, not the only
            entry point.
          </p>
        </motion.div>

        {/* Timeline - Desktop Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-stretch justify-between gap-3 lg:gap-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  className="flex items-stretch flex-1"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {/* Step Card */}
                  <div className="bg-white rounded-2xl p-5 flex-1 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col min-h-[220px]">
                    {/* Header: Step + Icon + Label */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-[var(--data-emerald)] text-xs font-bold block">{step.step}</span>
                        <h3 className="text-base font-bold text-[var(--forest-canopy)]">{step.label}</h3>
                      </div>
                    </div>
                    
                    {/* Bullet Points */}
                    <ul className="space-y-2 flex-1">
                      {step.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[var(--data-emerald)] shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex items-center justify-center w-10 lg:w-14 shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.2 + 0.3 }}
                      className="flex items-center"
                    >
                      <div className="w-4 lg:w-8 h-0.5 bg-gradient-to-r from-[var(--data-emerald)] to-[var(--data-emerald)]/50" />
                      <ChevronRight className="w-5 h-5 text-[var(--data-emerald)] -ml-1" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* Result Card */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="bg-[var(--forest-canopy)] rounded-2xl p-5 border-2 border-[var(--data-emerald)] flex flex-col min-h-[220px] relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--data-emerald)] to-emerald-400 flex items-center justify-center shadow-lg">
                      <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-[var(--data-emerald)] text-xs font-bold block">RESULT</span>
                      <h3 className="text-base font-bold text-white">Full Traceability</h3>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-white/80 leading-relaxed flex-1">
                    Every harvest linked to origin. Every shipment with complete compliance data. No paperwork gaps. No audit surprises.
                  </p>
                  
                  {/* Badge */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-[var(--data-emerald)]/20 rounded-full px-3 py-1.5 self-start">
                    <span className="w-2 h-2 rounded-full bg-[var(--data-emerald)] animate-pulse" />
                    <span className="text-xs font-semibold text-[var(--data-emerald)]">One Trade ID</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline - Mobile Vertical */}
        <div className="md:hidden flex flex-col gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Step Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--data-emerald)] text-xs font-bold">{step.step}</span>
                        <h3 className="text-base font-bold text-[var(--forest-canopy)]">{step.label}</h3>
                      </div>
                      <ul className="space-y-1">
                        {step.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--data-emerald)] shrink-0" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Vertical Arrow */}
                <div className="flex justify-center py-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-0.5 h-3 bg-gradient-to-b from-[var(--data-emerald)] to-[var(--data-emerald)]/50" />
                    <ArrowDown className="w-4 h-4 text-[var(--data-emerald)] -mt-0.5" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

          {/* Result Card - Mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-[var(--forest-canopy)] rounded-2xl p-4 border-2 border-[var(--data-emerald)] relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--data-emerald)] to-emerald-400 flex items-center justify-center shadow-lg shrink-0">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[var(--data-emerald)] text-xs font-bold">RESULT</span>
                      <h3 className="text-base font-bold text-white">Full Traceability</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed mb-3">
                      Every harvest linked to origin. Every shipment with complete compliance data. No paperwork gaps.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)]/20 rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--data-emerald)] animate-pulse" />
                      <span className="text-xs font-semibold text-[var(--data-emerald)]">One Trade ID</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
