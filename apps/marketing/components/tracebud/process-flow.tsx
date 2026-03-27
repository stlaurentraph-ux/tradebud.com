"use client";

import { motion } from "framer-motion";
import { Smartphone, MapPin, Wheat, ArrowRight, Package, Ship, FileCheck, Building2 } from "lucide-react";

const steps = [
  {
    actor: "Field Operators",
    color: "var(--data-emerald)",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    steps: [
      { icon: Smartphone, title: "Download App", description: "Get the offline-capable Tracebud app" },
      { icon: MapPin, title: "Geolocate Fields", description: "Map plot boundaries with GPS precision" },
      { icon: Wheat, title: "Register Harvest", description: "Log production with timestamps" },
      { icon: Package, title: "Trade", description: "Generate unique Trade ID for each sale" },
    ],
  },
  {
    actor: "Exporters",
    color: "var(--mountain-clay)",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    steps: [
      { icon: Package, title: "Collect Trade IDs", description: "Receive verified trade identifiers" },
      { icon: FileCheck, title: "Aggregate Batches", description: "Combine multiple Trade IDs" },
      { icon: Ship, title: "Generate Shipment", description: "Create compliant export documentation" },
    ],
  },
  {
    actor: "Importers",
    color: "var(--forest-canopy)",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    steps: [
      { icon: Ship, title: "Receive Shipment", description: "Get full traceability data" },
      { icon: FileCheck, title: "Access Compliance Data", description: "All documentation ready" },
      { icon: Building2, title: "Report to EU", description: "Submit for EUDR compliance" },
    ],
  },
];

export function ProcessFlow() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            How It Works
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            From field to port to market — one seamless chain of trust
          </p>
        </motion.div>

        <div className="space-y-12">
          {steps.map((section, sectionIndex) => (
            <motion.div
              key={section.actor}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.2 }}
              className={`rounded-3xl p-8 md:p-10 ${section.bgColor} border ${section.borderColor}`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: section.color }}
                >
                  {sectionIndex + 1}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold" style={{ color: section.color }}>
                  {section.actor}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.steps.map((step, stepIndex) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${section.color}20` }}
                      >
                        <step.icon className="w-5 h-5" style={{ color: section.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    {stepIndex < section.steps.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground/50 shrink-0 hidden lg:block mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connection arrows between sections */}
        <div className="flex justify-center my-8">
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            <div className="w-px h-8 bg-muted-foreground/30" />
            <ArrowRight className="w-6 h-6 rotate-90" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8 p-8 rounded-3xl bg-[var(--forest-canopy)] text-white"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            One Trade ID. Full Traceability.
          </h3>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Every harvest is linked to its origin plot. Every shipment carries complete compliance data. 
            No paperwork gaps. No audit surprises.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
