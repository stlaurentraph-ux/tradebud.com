"use client";

import { useEffect } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Exporters | Tracebud",
  description: "Batch aggregation, EUDR compliance, yield verification. Speed up exports with automated DDS packages and full audit trails.",
};
import { motion } from "framer-motion";
import { Package, Scale, FileCheck, Shield, Truck, CheckCircle, AlertTriangle, Clock, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

const DASHBOARD_URL = "https://app.tracebud.com";
const EXPORTER_DEMO = "https://exporter-demo.tracebud.com";

const features = [
  {
    icon: Package,
    title: "Batch Aggregation",
    description: "Bundle verified Farmer Vouchers into single delivery payloads with automatic compliance validation.",
    benefit: "Process 10x faster"
  },
  {
    icon: Scale,
    title: "Yield Cap Validation",
    description: "Automatic fraud detection cross-references weight against biological carrying capacity.",
    benefit: "100% fraud detection"
  },
  {
    icon: FileCheck,
    title: "DDS Automation",
    description: "Generate Due Diligence Statements automatically from verified farmer data in minutes.",
    benefit: "Zero manual entry"
  },
  {
    icon: Shield,
    title: "TRACES NT Integration",
    description: "Direct SOAP/XML middleware with WS-Security. Automated polygon chunking for complex geometries.",
    benefit: "Direct EUDR reporting"
  },
];

const dashboardStats = [
  { label: "Pending Batches", value: "12", status: "warning", change: "+2" },
  { label: "Verified Today", value: "847", status: "success", change: "+15%" },
  { label: "Compliance Rate", value: "98.2%", status: "success", change: "+2.1%" },
  { label: "Flagged", value: "3", status: "error", change: "-1" },
];

const recentBatches = [
  { id: "BTH-2024-001", farms: 156, weight: "23,400 kg", status: "verified", commodity: "Coffee", date: "Today" },
  { id: "BTH-2024-002", farms: 89, weight: "12,100 kg", status: "pending", commodity: "Cocoa", date: "Today" },
  { id: "BTH-2024-003", farms: 234, weight: "35,200 kg", status: "verified", commodity: "Coffee", date: "Yesterday" },
];

export default function ExportersPage() {
  useEffect(() => {
    document.title = "Exporters | Tracebud - Batch Aggregation & Compliance";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center py-20 md:py-32">
        <div className="absolute inset-0">
          <Image
            src="/images/exporter-hero.jpg"
            alt="Aerial view of container port with cargo ship loaded for export"
            fill
            className="object-cover"
            priority
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--mountain-clay)]/90 via-[var(--mountain-clay)]/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white text-[var(--mountain-clay)] px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-6 md:mb-8">
              <Truck className="w-4 h-4" />
              <span>Exporter Dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tight leading-tight">
              Ship Faster.<br />Batch Smarter.
            </h1>
            <p className="text-lg md:text-2xl text-white/90 mb-8 md:mb-10 leading-relaxed">
              Automated Due Diligence Statements, transaction linking, and yield cap validation to prevent illicit blending.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white hover:bg-white/90 text-[var(--mountain-clay)] font-bold px-6 md:px-10 py-4 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
              >
                <a href={`${DASHBOARD_URL}/signup?role=exporter`} target="_blank" rel="noopener noreferrer">
                  Start free trial
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-4 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
              >
                <a href={EXPORTER_DEMO} target="_blank" rel="noopener noreferrer">
                  Try demo first
                </a>
              </Button>
            </div>
            <p className="text-white/60 text-sm mt-4">
              30 days free. No credit card required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview with Features */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 md:mb-6">
              Complete Visibility Into Your Supply Chain
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-3xl mx-auto">
              Manage batches, verify transactions, generate DDS documents, and report to EUDR—all from one intelligent interface.
            </p>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            className="bg-gray-900 rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-2xl mb-12 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-800 rounded-xl md:rounded-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-2 md:mx-4">
                  <div className="bg-gray-600 rounded-md px-3 md:px-4 py-1 md:py-1.5 text-gray-300 text-xs md:text-sm truncate">
                    dashboard.tracebud.com/batches
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="bg-white p-3 md:p-6 overflow-x-auto">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                  {dashboardStats.map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-4">
                      <div className="flex items-center justify-between gap-2 mb-1 md:mb-2">
                        <div className="flex items-center gap-1 md:gap-2">
                          {stat.status === "success" && <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />}
                          {stat.status === "warning" && <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />}
                          {stat.status === "error" && <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />}
                          <span className="text-gray-500 text-[10px] md:text-xs">{stat.label}</span>
                        </div>
                        <span className={`text-[9px] md:text-xs font-semibold ${stat.status === "success" ? "text-emerald-600" : stat.status === "warning" ? "text-amber-600" : "text-red-600"}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Table Preview */}
                <div className="border border-gray-200 rounded-lg md:rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">Recent Batches</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 whitespace-nowrap">Batch ID</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 hidden sm:table-cell whitespace-nowrap">Commodity</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 hidden md:table-cell whitespace-nowrap">Farms</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 whitespace-nowrap">Weight</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBatches.map((batch) => (
                          <tr key={batch.id} className="border-t border-gray-100">
                            <td className="px-3 md:px-4 py-2 md:py-3 font-mono text-[10px] md:text-sm text-gray-900 whitespace-nowrap">{batch.id}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-700 hidden sm:table-cell whitespace-nowrap">{batch.commodity}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-700 hidden md:table-cell whitespace-nowrap">{batch.farms}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-700 whitespace-nowrap">{batch.weight}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <span className={`px-2 md:px-2.5 py-1 rounded-full text-[9px] md:text-xs font-semibold whitespace-nowrap inline-block ${
                                batch.status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {batch.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 hover:border-[var(--mountain-clay)] hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[var(--mountain-clay)]/10 flex items-center justify-center mb-3 md:mb-4">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-[var(--mountain-clay)]" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-foreground/70 mb-3 md:mb-4 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center gap-2 text-[var(--mountain-clay)] font-semibold text-xs md:text-sm">
                    <Zap className="w-4 h-4" />
                    {feature.benefit}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative py-16 md:py-32">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2070&auto=format&fit=crop"
            alt="Coffee beans close-up at export facility"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--mountain-clay)]/70" />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-3xl text-white font-medium leading-relaxed mb-6 md:mb-8 italic">
              &ldquo;We cut our compliance processing time by 80%. What used to take weeks now happens in
              hours.&rdquo;
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop"
                  alt="Carlos Rodriguez"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="text-white font-bold text-base md:text-lg">Carlos Rodriguez</div>
                <div className="text-white/70 text-sm md:text-base">Operations Director, CafeExport S.A.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Start exporting with confidence
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
              30-day free trial with full access. Set up your exporter dashboard in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-[var(--mountain-clay)] hover:bg-[var(--clay-light)] text-white font-bold px-10 py-6 text-lg rounded-full"
              >
                <a href={`${DASHBOARD_URL}/signup?role=exporter`} target="_blank" rel="noopener noreferrer">
                  Start free trial
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--mountain-clay)] text-[var(--mountain-clay)] font-bold px-10 py-6 text-lg rounded-full"
              >
                <a href={EXPORTER_DEMO} target="_blank" rel="noopener noreferrer">
                  Try demo first
                </a>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/demo"
                className="text-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                Need a personalized demo?
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="hidden sm:inline text-foreground/30">|</span>
              <Link
                href="/pricing"
                className="text-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                View pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
