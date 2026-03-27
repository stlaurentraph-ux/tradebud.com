"use client";

import { motion } from "framer-motion";
import { ArrowRight, Code, Server, Lock, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const apiFeatures = [
  {
    title: "REST Endpoints",
    description: "Sync with national registries (ICF, IHCAFE) to pre-populate cadastral boundaries and verify producer status.",
    icon: Server,
  },
  {
    title: "SOAP/XML Middleware",
    description: "Dedicated backend layer that constructs verbose SOAP/XML envelopes for TRACES NT with WS-Security headers.",
    icon: Code,
  },
  {
    title: "Payload Chunking",
    description: "Automated coordinate chunking for complex GeoJSON polygons that exceed TRACES NT file size limits.",
    icon: Zap,
  },
  {
    title: "Role-Based Access",
    description: "Symmetric encryption with RBAC. Consumers see Polygon ID; authorized auditors get decryption keys.",
    icon: Lock,
  },
];

const partners = [
  { name: "AgStack", type: "Data Infrastructure" },
  { name: "IHCAFE", type: "National Registry" },
  { name: "ICF", type: "National Registry" },
  { name: "TRACES NT", type: "EU System" },
  { name: "Sentinel-2", type: "Earth Observation" },
  { name: "Global Forest Watch", type: "Monitoring" },
];

export function Interoperability() {
  return (
    <section id="partners" className="relative py-32 px-6 overflow-hidden bg-[var(--forest-canopy)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            API & Interoperability
          </h2>
          <p className="text-[var(--data-emerald)] text-2xl md:text-3xl font-bold mb-6">
            {"We don't compete with infrastructure. We power it."}
          </p>
          <p className="text-white/80 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Open architecture designed to integrate with existing national and international systems.
          </p>
        </motion.div>

        {/* API Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20">
          {apiFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="bg-white/10 border-2 border-white/20 rounded-xl md:rounded-2xl p-5 md:p-8 hover:border-[var(--data-emerald)] hover:bg-white/15 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--data-emerald)]/10 flex items-center justify-center mb-4 md:mb-6">
                  <Icon className="w-5 h-5 md:w-7 md:h-7 text-[var(--data-emerald)]" />
                </div>
                <h3 className="font-bold text-base md:text-xl text-white mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Partner Network Visualization */}
        <motion.div
          className="bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 opacity-10">
            <Image
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2127&auto=format&fit=crop"
              alt="Network background"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10">
            <h3 className="text-xl md:text-3xl font-bold text-white text-center mb-8 md:mb-12">
              Connected Ecosystem
            </h3>

            {/* Central hub visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
              {partners.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl px-4 md:px-6 py-3 md:py-4 border border-white/20 hover:border-[var(--data-emerald)] transition-colors cursor-pointer text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="font-bold text-white text-sm md:text-base">{partner.name}</div>
                  <div className="text-white/50 text-xs md:text-sm">{partner.type}</div>
                </motion.div>
              ))}
            </div>

            {/* Connection visualization */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
              <div className="hidden sm:block w-4 h-4 rounded-full bg-[var(--data-emerald)] animate-pulse" />
              <div className="hidden sm:block w-12 md:w-24 h-1 bg-gradient-to-r from-[var(--data-emerald)] to-white/50 rounded-full" />
              <div className="px-6 md:px-8 py-3 md:py-4 rounded-full bg-[var(--data-emerald)] text-[var(--forest-canopy)] text-base md:text-lg font-bold">
                Tracebud Rails
              </div>
              <div className="hidden sm:block w-12 md:w-24 h-1 bg-gradient-to-r from-white/50 to-[var(--data-emerald)] rounded-full" />
              <div className="hidden sm:block w-4 h-4 rounded-full bg-[var(--data-emerald)] animate-pulse" />
            </div>

            <div className="text-center mt-8 md:mt-12 px-2">
              <Link href="/exporters" className="block sm:inline-block">
                <Button
                  size="lg"
                  className="bg-white text-[var(--forest-canopy)] hover:bg-white/90 font-bold px-5 md:px-8 py-3 md:py-6 text-sm md:text-lg gap-2 md:gap-3 rounded-full w-full sm:w-auto whitespace-normal text-center"
                >
                  Explore API Documentation
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
