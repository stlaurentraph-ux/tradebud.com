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
            <div className="relative w-[280px] mx-auto">
              <Image
                src="/images/farmer-app-homepage.png"
                alt="Tracebud Farmer App"
                width={320}
                height={693}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
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
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <Image
                src="/images/exporter-hero.jpg"
                alt="Dashboard showing supply chain tracking and compliance management"
                width={800}
                height={500}
                className="w-full h-auto"
              />
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
