"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, WifiOff, MapPin, Camera, CheckCircle } from "lucide-react";
import Image from "next/image";

export function Products() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            Two products, one workflow
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
            Built for how supply chains actually work
          </h2>
        </motion.div>

        {/* The App */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[var(--data-emerald)]" />
              </div>
              <span className="text-sm font-semibold text-[var(--data-emerald)] uppercase tracking-wide">Mobile App</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
              An offline app for producers and field teams
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Designed for low-connectivity environments. Icon-led flows, low-literacy assumptions, and no requirement for uninterrupted connectivity. Create usable origin proof directly from the farm.
            </p>

            <div className="space-y-4">
              {[
                { icon: WifiOff, text: "Works offline, syncs when connectivity returns" },
                { icon: MapPin, text: "Walk the boundary to capture GPS polygon" },
                { icon: Camera, text: "Photo evidence and consent recording" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--warm-stone)] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[var(--forest-canopy)]" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--data-emerald)]/20 to-[var(--forest-canopy)]/20 rounded-3xl" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-3 w-64">
                  <div className="bg-[var(--forest-canopy)] rounded-[2rem] aspect-[9/19] flex flex-col items-center justify-center text-white p-6">
                    <MapPin className="w-12 h-12 mb-4 opacity-80" />
                    <p className="text-center text-sm opacity-90">Walk your plot boundary</p>
                    <div className="mt-6 w-full bg-[var(--data-emerald)] rounded-full py-3 text-center text-sm font-semibold">
                      Start Mapping
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* The Dashboard */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--warm-stone)] to-white">
                {/* Mock Dashboard UI */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {["Ready to ship", "Needs action", "Pending"].map((status, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-2xl font-bold text-[var(--forest-canopy)]">{[24, 3, 12][i]}</div>
                        <div className="text-xs text-gray-500">{status}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-[var(--data-emerald)]" />
                      <span className="font-medium text-sm">Shipment #2847 verified</span>
                    </div>
                    <div className="h-2 bg-[var(--warm-stone)] rounded-full">
                      <div className="h-2 bg-[var(--data-emerald)] rounded-full w-4/5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--forest-canopy)]/10 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
              <span className="text-sm font-semibold text-[var(--forest-canopy)] uppercase tracking-wide">Dashboard</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--forest-canopy)] mb-4">
              A dashboard for cooperatives, exporters, and buyers
            </h3>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              See what is ready, what is blocked, which shipments can be sealed, and which compliance issues need action. Your operational cockpit for turning field data into buyer-ready proof.
            </p>

            <div className="space-y-4">
              {[
                "Track readiness across all producers",
                "Identify missing evidence instantly",
                "Assemble DDS packages for shipment",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-[var(--data-emerald)] flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
