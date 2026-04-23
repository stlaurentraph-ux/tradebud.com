"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Users,
  Truck,
  Building2,
  Globe,
  ArrowRight,
  Smartphone,
  FileCheck,
  Eye,
  Server,
  Handshake,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const verticals = [
  {
    id: "farmers",
    title: "Farmers & SME Operators",
    hook: "Own your data. Access any market.",
    description: "Full data ownership with offline-first polygon mapping. Simplified declaration workflow for micro/small operators in low-risk countries.",
    features: ["Offline GPS mapping", "Photo Vault verification", "Digital receipts", "QR compliance proof"],
    icon: Users,
    featureIcon: Smartphone,
    color: "var(--data-emerald)",
    href: "/farmers",
    image: "/images/farmer-hero.jpg",
  },
  {
    id: "exporters",
    title: "Exporters & Operators",
    hook: "Ship faster. Batch smarter.",
    description:
      "Automated Due Diligence Statements, identity-preserving batches (no EUDR mass-balance obscuring), yield checks, and TRACES-oriented workflows.",
    features: ["IP / segregated batches", "Yield sanity checks", "DDS automation", "TRACES NT integration"],
    icon: Truck,
    featureIcon: FileCheck,
    color: "var(--mountain-clay)",
    href: "/exporters",
    image: "/images/exporter-hero.jpg",
  },
  {
    id: "cooperatives",
    title: "Cooperatives & Producer Groups",
    hook: "Roll up members. Keep every plot attributable.",
    description:
      "Member-level field data rolls into cooperative batches for exporters—identity-preserving batches, evidence vaults, and DDS handoffs without mass-balance blending.",
    features: ["Member plot queue", "Coop batches & DDS prep", "Exporter handoff", "Tenant-scoped roles"],
    icon: Handshake,
    featureIcon: Users,
    color: "var(--data-emerald)",
    href: "/farmers?account=cooperative",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "importers",
    title: "Importers & Roasters",
    hook: "Zero-risk transparency.",
    description: "Full upstream visibility with RBAC-controlled access to supplier details. Audit-ready documentation for CSRD compliance.",
    features: ["Supply chain visibility", "Liability tracking", "CSRD reporting", "Audit documentation"],
    icon: Building2,
    featureIcon: Eye,
    color: "var(--forest-canopy)",
    href: "/importers",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "countries",
    title: "Countries & Registries",
    hook: "DPI-Native Infrastructure.",
    description: "REST endpoints for national registries like ICF and IHCAFE. Strengthen public interest data while maintaining sovereignty.",
    features: ["Registry sync", "Cadastral integration", "National oversight", "Data sovereignty"],
    icon: Globe,
    featureIcon: Server,
    color: "var(--data-emerald)",
    href: "/countries",
    image: "/images/country-hero.jpg",
  },
];

export function Verticals() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="stakeholders" className="py-32 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="text-foreground/80 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            From smallholders and cooperatives to EU importers—each segment uses the same unified platform with organization-scoped roles
            and tailored workflows.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {verticals.map((vertical, index) => {
            const Icon = vertical.icon;
            const FeatureIcon = vertical.featureIcon;
            const isHovered = hoveredId === vertical.id;

            return (
              <Link href={vertical.href} key={vertical.id}>
                <motion.div
                  className={`relative group cursor-pointer rounded-3xl overflow-hidden transition-all duration-500 ${
                    isHovered ? "shadow-2xl scale-[1.02]" : "shadow-lg"
                  }`}
                  style={{
                    borderLeft: `4px solid ${vertical.color}`,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredId(vertical.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <Image
                      src={vertical.image}
                      alt={vertical.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div 
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        background: `linear-gradient(to top, ${vertical.color}dd 0%, ${vertical.color}99 20%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)`,
                      }}
                    />
                  </div>

                  <div className="relative p-6 md:p-10 flex flex-col h-full min-h-[360px] md:min-h-[440px] justify-end">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex gap-2 md:gap-3">
                        <div
                          className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-white/20 backdrop-blur-sm"
                        >
                          <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div
                          className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: vertical.color }}
                        >
                          <FeatureIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                      </div>
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-full"
                        animate={{ x: isHovered ? 0 : -10 }}
                      >
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </motion.div>
                    </div>

                    <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">
                      {vertical.title}
                    </h3>

                    <p
                      className="text-base md:text-2xl font-semibold mb-3 md:mb-4"
                      style={{ color: vertical.color }}
                    >
                      {vertical.hook}
                    </p>

                    <p className="text-white/80 text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">
                      {vertical.description}
                    </p>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {vertical.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 md:px-3 py-1 md:py-1.5 backdrop-blur-sm rounded-full text-xs md:text-sm text-white font-medium"
                          style={{ backgroundColor: `${vertical.color}44` }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
