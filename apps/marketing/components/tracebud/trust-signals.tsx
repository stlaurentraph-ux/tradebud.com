"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  MapPin, 
  Globe, 
  Shield, 
  Award,
  Linkedin
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const pilotMetrics = [
  { value: "12+", label: "Farms Onboarding", icon: MapPin },
  { value: "3", label: "Countries", icon: Globe },
  { value: "2", label: "Commodities", icon: Award },
];

const partnerships = [
  { name: "GS1 EPCIS", description: "Global traceability standard" },
  { name: "AgStack", description: "Linux Foundation project" },
  { name: "TRACES NT", description: "EU import system" },
  { name: "SAI Platform", description: "Farm sustainability" },
];

const teamMembers = [
  {
    name: "Agricultural Technology Lead",
    role: "10+ years in agri-tech supply chains",
    credential: "Former FAO consultant",
    linkedin: "#",
  },
  {
    name: "Compliance & Regulatory Lead",
    role: "EU trade regulation expert",
    credential: "EUDR working group member",
    linkedin: "#",
  },
  {
    name: "Data & Engineering Lead",
    role: "Satellite imagery & GIS specialist",
    credential: "Ex-Planet Labs",
    linkedin: "#",
  },
];

export function TrustSignals() {
  return (
    <section className="py-16 md:py-20 px-6 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto">
        {/* Pilot Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)]/10 text-[var(--forest-canopy)] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              <span>Currently Onboarding</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {pilotMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <metric.icon className="w-5 h-5 text-[var(--data-emerald)]" />
                  <span className="text-4xl md:text-5xl font-bold text-foreground">{metric.value}</span>
                </div>
                <span className="text-sm md:text-base text-muted-foreground">{metric.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partnership Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Built on Industry Standards
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {partnerships.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="group flex flex-col items-center bg-card border border-border rounded-xl px-6 py-4 hover:border-[var(--data-emerald)] hover:shadow-md transition-all"
              >
                <span className="font-bold text-foreground group-hover:text-[var(--forest-canopy)] transition-colors">{partner.name}</span>
                <span className="text-xs text-muted-foreground">{partner.description}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Built by Industry Experts
            </h3>
            <p className="text-muted-foreground">
              Our team brings decades of experience in agricultural technology, EU trade compliance, and data engineering.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 * index }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-[var(--data-emerald)] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--forest-canopy)]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[var(--forest-canopy)]" />
                  </div>
                  <Link 
                    href={member.linkedin}
                    className="p-2 rounded-full bg-muted hover:bg-[var(--data-emerald)]/20 transition-colors"
                    aria-label={`${member.name} LinkedIn profile`}
                  >
                    <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-[var(--forest-canopy)]" />
                  </Link>
                </div>
                <h4 className="font-bold text-lg text-foreground mb-1">{member.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)]/10 text-[var(--forest-canopy)] px-3 py-1 rounded-full text-xs font-semibold">
                  <Award className="w-3 h-3" />
                  {member.credential}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
