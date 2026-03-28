"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Eye, Shield, FileText, Lock, Building2, Users, MapPin, BarChart3, Globe, CheckCircle,
  Package, AlertTriangle, Clock, TrendingUp, FileCheck, Download, Search, Filter,
  ChevronRight, ArrowRight, Truck, Leaf, Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

const features = [
  {
    icon: Eye,
    title: "Full Supply Chain Visibility",
    description: "Track every batch from farm polygon to your warehouse. RBAC-controlled access to upstream supplier details.",
  },
  {
    icon: Shield,
    title: "Liability Protection",
    description: "Access full due diligence documentation to assume legal liability under EUDR Article 9 with confidence.",
  },
  {
    icon: FileText,
    title: "CSRD Reporting Ready",
    description: "DPP-style architecture with GS1 EPCIS standards. Audit-ready documentation for Corporate Sustainability Reporting.",
  },
  {
    icon: Lock,
    title: "Encrypted PII Access",
    description: "Farmer PII is symmetrically encrypted. Authorized importers receive decryption keys via RBAC.",
  },
];

const complianceMetrics = [
  { label: "Active Suppliers", value: "2,847", icon: Users },
  { label: "Verified Polygons", value: "12,456", icon: MapPin },
  { label: "Countries of Origin", value: "8", icon: Globe },
  { label: "EUDR Compliance", value: "99.2%", icon: CheckCircle },
];

// Dashboard data for the visual mockup
const shipmentData = [
  { id: "SHP-2024-0891", origin: "Honduras", commodity: "Coffee", weight: "18,500 kg", farms: 234, status: "verified", compliance: 100 },
  { id: "SHP-2024-0890", origin: "Ivory Coast", commodity: "Cocoa", weight: "12,300 kg", farms: 156, status: "verified", compliance: 100 },
  { id: "SHP-2024-0889", origin: "Uganda", commodity: "Coffee", weight: "8,750 kg", farms: 89, status: "pending", compliance: 94 },
];

const supplyChainNodes = [
  { label: "Farms Mapped", value: "12,456", icon: MapPin, color: "bg-emerald-500" },
  { label: "Cooperatives", value: "47", icon: Users, color: "bg-teal-500" },
  { label: "Exporters", value: "24", icon: Truck, color: "bg-cyan-500" },
  { label: "Your Facility", value: "99.2%", icon: Building2, color: "bg-blue-500" },
];

export default function ImportersPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    primaryGoal: "",
    biggestChallenge: "",
    phone: "",
    hqLocation: "",
    commodities: "",
    annualImportVolume: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Importers | Tracebud - Full Supply Chain Visibility";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryGoal) {
      setSubmitError("Please select your primary goal.");
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "importer",
          sourcePage: "/importers",
          name: formData.contactName,
          email: formData.email,
          company: formData.companyName,
          phone: formData.phone || null,
          country: formData.hqLocation || null,
          message: formData.biggestChallenge || null,
          payload: formData,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to submit form.");
      }

      setSubmitMessage("Thanks - your request was submitted. We will contact you shortly.");
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        primaryGoal: "",
        biggestChallenge: "",
        phone: "",
        hqLocation: "",
        commodities: "",
        annualImportVolume: "",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unexpected error while submitting.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
            alt="Professional coffee roasting and quality control"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)] text-[var(--forest-canopy)] px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-6 md:mb-8">
                <Building2 className="w-3 h-3 md:w-4 md:h-4" />
                <span>Importer Portal</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tight leading-tight">
                Zero-Risk<br />Transparency
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-10 leading-relaxed">
                Full upstream visibility with RBAC-controlled access. Audit-ready for EUDR and CSRD compliance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <a
                  href="https://importer-demo.tracebud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
                  >
                    Try demo dashboard
                  </Button>
                </a>
                <a href="#signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
                  >
                    Request quote
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Mini Dashboard Preview in Hero */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--data-emerald)] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-semibold text-sm">Live Compliance Status</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {complianceMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="bg-white/10 rounded-xl p-3">
                        <Icon className="w-4 h-4 text-[var(--data-emerald)] mb-1" />
                        <div className="text-xl font-bold text-white">{metric.value}</div>
                        <div className="text-white/60 text-xs">{metric.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Only */}
      <section className="py-8 md:py-16 px-4 md:px-6 bg-[var(--forest-canopy)] lg:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {complianceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  className="text-center bg-white/5 rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-6 h-6 text-[var(--data-emerald)] mx-auto mb-2" />
                  <div className="text-2xl md:text-4xl font-bold text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-white/70 text-xs md:text-sm">{metric.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Dashboard Preview */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Complete visibility into your supply chain
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Track every batch from farm to your facility. Know exactly where your coffee or cocoa comes from with polygon-level precision.
            </p>
          </motion.div>

          {/* Main Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-900 rounded-2xl md:rounded-3xl p-2 md:p-4 shadow-2xl"
          >
            <div className="bg-gray-800 rounded-xl md:rounded-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-2 md:mx-4">
                  <div className="bg-gray-600 rounded-md px-3 md:px-4 py-1 md:py-1.5 text-gray-300 text-xs md:text-sm truncate">
                    portal.tracebud.com/importer/supply-chain
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="bg-[#f8fafc]">
                {/* Dashboard Header */}
                <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/images/tracebud-logo.png"
                        alt="Tracebud"
                        width={28}
                        height={28}
                        className="rounded"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base">Supply Chain Dashboard</h3>
                        <p className="text-gray-500 text-xs">Real-time compliance monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">EUDR</span> Compliant
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Body */}
                <div className="p-4 md:p-6">
                  {/* Supply Chain Flow Visual */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base">Supply Chain Traceability</h4>
                      <span className="text-xs text-gray-500">Live data</span>
                    </div>
                    
                    {/* Flow Nodes */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-2">
                      {supplyChainNodes.map((node, index) => {
                        const Icon = node.icon;
                        return (
                          <div key={node.label} className="flex items-center w-full md:w-auto">
                            <div className="flex-1 md:flex-initial bg-gray-50 rounded-xl p-3 md:p-4 text-center min-w-[100px] md:min-w-[120px]">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${node.color} flex items-center justify-center mx-auto mb-2`}>
                                <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              </div>
                              <div className="text-lg md:text-xl font-bold text-gray-900">{node.value}</div>
                              <div className="text-xs text-gray-500">{node.label}</div>
                            </div>
                            {index < supplyChainNodes.length - 1 && (
                              <ChevronRight className="w-5 h-5 text-gray-300 mx-2 hidden md:block" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-gray-500 text-xs">Verified</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">847</div>
                      <div className="text-xs text-emerald-600">+12% this month</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-gray-500 text-xs">Pending</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">12</div>
                      <div className="text-xs text-gray-500">Awaiting review</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-500 text-xs">Total Volume</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">2.4M</div>
                      <div className="text-xs text-gray-500">kg this quarter</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Leaf className="w-4 h-4 text-emerald-500" />
                        <span className="text-gray-500 text-xs">Zero Deforestation</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">100%</div>
                      <div className="text-xs text-emerald-600">All shipments verified</div>
                    </div>
                  </div>

                  {/* Shipments Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm">Recent Shipments</h4>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
                          <Filter className="w-3 h-3" /> Filter
                        </button>
                        <button className="text-xs text-[var(--data-emerald)] font-semibold flex items-center gap-1">
                          View All <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden p-3 space-y-3">
                      {shipmentData.map((shipment) => (
                        <div key={shipment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-semibold text-gray-900">{shipment.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              shipment.status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {shipment.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-gray-500">Origin:</span> <span className="text-gray-900">{shipment.origin}</span></div>
                            <div><span className="text-gray-500">Commodity:</span> <span className="text-gray-900">{shipment.commodity}</span></div>
                            <div><span className="text-gray-500">Weight:</span> <span className="text-gray-900">{shipment.weight}</span></div>
                            <div><span className="text-gray-500">Farms:</span> <span className="text-gray-900">{shipment.farms}</span></div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Compliance</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${shipment.compliance}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600">{shipment.compliance}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Shipment ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Origin</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Commodity</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Weight</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Farms</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Compliance</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentData.map((shipment) => (
                            <tr key={shipment.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{shipment.id}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{shipment.origin}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{shipment.commodity}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{shipment.weight}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{shipment.farms}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${shipment.compliance}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-emerald-600">{shipment.compliance}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  shipment.status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {shipment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button className="text-[var(--data-emerald)] hover:text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                  <Download className="w-3 h-3" /> DDS
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Highlights Below Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Eye, label: "Real-time tracking", desc: "Batch-level visibility" },
              { icon: MapPin, label: "Polygon verification", desc: "GPS-precise origins" },
              { icon: FileCheck, label: "One-click DDS", desc: "Auto-generated reports" },
              { icon: Shield, label: "TRACES NT ready", desc: "Direct integration" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  className="text-center p-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-[var(--data-emerald)]" />
                  </div>
                  <h4 className="font-bold text-foreground text-sm md:text-base mb-1">{item.label}</h4>
                  <p className="text-foreground/60 text-xs md:text-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Enterprise-Grade Compliance
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Tools built for EU importers who need full supply chain transparency.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--data-emerald)]/10 flex items-center justify-center mb-4 md:mb-6">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-[var(--data-emerald)]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1611174275735-21c4fd75d9ec?q=80&w=2070&auto=format&fit=crop"
            alt="Coffee cupping session"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--forest-canopy)]/85" />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-2xl lg:text-3xl text-white font-medium leading-relaxed mb-6 md:mb-8 italic">
              &ldquo;Tracebud gives us the confidence to tell our customers exactly where their coffee comes from. Full transparency, zero guesswork.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[var(--data-emerald)]">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
                  alt="Anna Schmidt"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm md:text-base">Anna Schmidt</div>
                <div className="text-white/70 text-xs md:text-sm">Head of Sustainability, EuroRoast GmbH</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sign Up Form */}
      <section id="signup" className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Request Portal Access
            </h2>
            <p className="text-base md:text-xl text-foreground/70">
              Tell us about your import operations and compliance requirements.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="bg-muted/30 rounded-2xl md:rounded-3xl p-6 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Company Name *</label>
                <Input
                  required
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact Name *</label>
                <Input
                  required
                  placeholder="Your full name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Email *</label>
                <Input
                  required
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Primary Goal *</label>
                <Select onValueChange={(value) => setFormData({ ...formData, primaryGoal: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select your top priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supply-chain-visibility">Supply chain visibility</SelectItem>
                    <SelectItem value="eudr-liability-readiness">EUDR liability readiness</SelectItem>
                    <SelectItem value="csrd-reporting-support">CSRD reporting support</SelectItem>
                    <SelectItem value="supplier-risk-screening">Supplier risk screening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                <Input
                  placeholder="+49 123 456 7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">HQ Location</label>
                <Select onValueChange={(value) => setFormData({ ...formData, hqLocation: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="netherlands">Netherlands</SelectItem>
                    <SelectItem value="belgium">Belgium</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="italy">Italy</SelectItem>
                    <SelectItem value="spain">Spain</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="other-eu">Other EU Country</SelectItem>
                    <SelectItem value="non-eu">Non-EU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Annual Import Volume</label>
                <Select onValueChange={(value) => setFormData({ ...formData, annualImportVolume: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select volume range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-500">Under 500 MT</SelectItem>
                    <SelectItem value="500-2000">500 - 2,000 MT</SelectItem>
                    <SelectItem value="2000-10000">2,000 - 10,000 MT</SelectItem>
                    <SelectItem value="over-10000">Over 10,000 MT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Primary Commodity</label>
                <Select onValueChange={(value) => setFormData({ ...formData, commodities: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coffee">Coffee</SelectItem>
                    <SelectItem value="cocoa">Cocoa</SelectItem>
                    <SelectItem value="rubber">Rubber</SelectItem>
                    <SelectItem value="palm-oil">Palm Oil</SelectItem>
                    <SelectItem value="soy">Soy</SelectItem>
                    <SelectItem value="timber">Timber</SelectItem>
                    <SelectItem value="multiple">Multiple Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">What do you need most right now? *</label>
              <Textarea
                required
                placeholder="In 1-2 sentences, describe the main result you want from Tracebud."
                rows={3}
                value={formData.biggestChallenge}
                onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 md:px-12 py-5 md:py-6 text-base md:text-lg rounded-full w-full sm:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Request Portal Access"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            {submitMessage ? (
              <p className="text-emerald-700 text-sm text-center mt-4">{submitMessage}</p>
            ) : null}
            {submitError ? (
              <p className="text-red-600 text-sm text-center mt-4">{submitError}</p>
            ) : null}
          </motion.form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
