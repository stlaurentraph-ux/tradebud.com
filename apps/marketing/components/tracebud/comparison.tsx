"use client";

import { motion } from "framer-motion";
import { X, Check, AlertTriangle, FileCheck, Shield, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const complianceChecks = [
  {
    regulation: "EUDR",
    name: "EU Deforestation Regulation",
    deadline: "Dec 30, 2026 (Large/Medium) | Jun 30, 2027 (Micro/Small)",
    status: "compliant",
    features: [
      "Polygon mapping with 6 decimal precision",
      "Deforestation baseline verification (Dec 31, 2020)",
      "Degradation-oriented forest-structure signals",
      "Identity-preserving batches (no mass-balance obscuring)",
      "TRACES NT SOAP/XML + integrity hooks (WS-Security, digests)",
      "5-year retention from market placement",
      "Secondary checks before highest-liability submissions",
    ],
  },
  {
    regulation: "CSRD",
    name: "Corporate Sustainability Reporting Directive",
    deadline: "2024-2026 (phased)",
    status: "ready",
    features: [
      "Voluntary DPP-style rails (ESPR exempts mandatory DPP for many foods/feeds—we still align for ESG)",
      "GS1 EPCIS-friendly event sharing",
      "Full supply chain visibility",
      "Audit-ready documentation",
      "ESG metrics tracking",
    ],
  },
  {
    regulation: "ILO",
    name: "International Labour Standards",
    deadline: "Ongoing compliance",
    status: "supported",
    features: [
      "Child/forced labor checklist",
      "Working conditions documentation",
      "FPIC repository for community consent",
      "Participatory mapping records",
    ],
  },
];

const integrations = [
  { name: "TRACES NT", description: "SOAP/XML + WS-Security & payload digests", status: "live" },
  { name: "IHCAFE", description: "Honduran Coffee Institute sync", status: "live" },
  { name: "ICF", description: "Honduran Forest Institute registry", status: "live" },
  { name: "Sentinel-2", description: "ESA satellite imagery", status: "live" },
  { name: "Global Forest Watch", description: "Deforestation monitoring", status: "live" },
  { name: "AgStack", description: "Open-source data infrastructure", status: "partner" },
];

export function Comparison() {
  return (
    <section id="compliance" className="relative py-32 px-6 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop"
          alt="Aerial view of farmland and forests"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[var(--forest-canopy)]/95" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Regulatory Compliance
          </h2>
          <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Built from the ground up to meet EU regulatory requirements with direct system integrations.
          </p>
        </motion.div>

        {/* Compliance Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
          {complianceChecks.map((item, index) => (
            <motion.div
              key={item.regulation}
              className="bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/10 hover:border-[var(--data-emerald)]/50 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className="text-2xl md:text-3xl font-bold text-[var(--data-emerald)]">{item.regulation}</span>
                <div
                  className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                    item.status === "compliant"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : item.status === "ready"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {item.status === "compliant" ? "Compliant" : item.status === "ready" ? "Ready" : "Supported"}
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{item.name}</h3>
              <p className="text-white/60 text-xs md:text-sm mb-4 md:mb-6">{item.deadline}</p>

              <ul className="space-y-2 md:space-y-3">
                {item.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 md:gap-3 text-white/80 text-sm md:text-base">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-[var(--data-emerald)] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Integration Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Direct Integrations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:border-[var(--data-emerald)]/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-5 h-5 text-[var(--data-emerald)]" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{integration.name}</h4>
                <p className="text-white/50 text-xs leading-tight">{integration.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/exporters">
            <Button
              size="lg"
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl gap-2 md:gap-3 rounded-full shadow-xl w-full sm:w-auto"
            >
              <FileCheck className="w-5 h-5 md:w-6 md:h-6" />
              View Compliance Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
