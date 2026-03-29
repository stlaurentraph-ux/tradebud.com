"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Satellite,
  Camera,
  FileText,
  Shield,
  Database,
  WifiOff,
  Timer,
  Fingerprint,
  Scale,
  Trees,
  Home,
} from "lucide-react";
import Image from "next/image";

const technologies = [
  {
    category: "GIS & Geolocation",
    icon: MapPin,
    color: "var(--data-emerald)",
    image: "/images/gis-geolocation.jpg",
    features: [
      { title: "Waypoint Averaging", description: "60-120 second coordinate streams at each polygon vertex", icon: Timer },
      {
        title: "Dual-Frequency GNSS",
        description:
          "L1/L5 when the device supports it. HDOP-style metrics are logged for QA—we never hard-lock capture in the canopy; warnings, not blocking gates.",
        icon: Satellite,
      },
      { title: "Offline Vector Tiles", description: "Pre-cached satellite imagery when GNSS fails", icon: WifiOff },
    ],
  },
  {
    category: "Compliance Engine",
    icon: Shield,
    color: "var(--mountain-clay)",
    image: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?q=80&w=2070&auto=format&fit=crop",
    features: [
      { title: "Deforestation AI", description: "Cross-references polygons against the Dec 31, 2020 baseline", icon: Satellite },
      {
        title: "Degradation signals",
        description:
          "Flags structural forest-cover changes—e.g. primary or naturally regenerating forest shifting toward plantation-style cover—alongside deforestation checks.",
        icon: Trees,
      },
      {
        title: "Ground-truth photo vault",
        description:
          "Timestamped, geo-tagged directional photos (e.g. cardinal views) to challenge satellite false-positives during audits.",
        icon: Camera,
      },
      {
        title: "Yield & batch sanity",
        description:
          "Cross-checks weights against plot capacity; supports identity-preserving batches and extra scrutiny before high-liability submissions.",
        icon: Scale,
      },
    ],
  },
  {
    category: "Land Tenure & Legality",
    icon: FileText,
    color: "var(--forest-canopy)",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop",
    features: [
      { title: "OCR Document Scanning", description: "Digitize Clave Catastral and formal titles", icon: FileText },
      {
        title: "Producer en posesión",
        description: "Support informal tenure paths with customary agreements and local attestations where formal title is not required by domestic law.",
        icon: Home,
      },
      { title: "Protected Area Workflow", description: "Amber flags for SINAPH overlaps with permit support", icon: MapPin },
      { title: "FPIC Repository", description: "Community assembly minutes and social agreements", icon: Database },
    ],
  },
  {
    category: "Security & Audit",
    icon: Database,
    color: "var(--data-emerald)",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop",
    features: [
      {
        title: "5-year retention posture",
        description:
          "EUDR-aligned retention of diligence and geometry from market placement; immutable-style audit logs with timestamps and device context.",
        icon: Database,
      },
      {
        title: "RBAC & reversible PII",
        description:
          "Farmer PII is protected with symmetric encryption and role-based access—competent authorities and importers of record can verify the chain without one-way hashing people out of audits.",
        icon: Fingerprint,
      },
      {
        title: "No mass-balance blending",
        description: "Identity-preserving, segregated batches keep plot-level origin visible—aligned with EUDR expectations for traceability, not anonymous pooling.",
        icon: Shield,
      },
    ],
  },
];

export function Technology() {
  return (
    <section id="technology" className="py-32 px-6 bg-[var(--forest-canopy)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Built for the Field
          </h2>
          <p className="text-white/80 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed">
            Tropical agroforestry demands specialized technology. We designed every feature for the realities of smallholder agriculture.
          </p>
        </motion.div>

        <div className="space-y-8">
          {technologies.map((tech, categoryIndex) => {
            const CategoryIcon = tech.icon;
            const isReversed = categoryIndex % 2 === 1;
            
            return (
              <motion.div
                key={tech.category}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-stretch`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              >
                {/* Image side */}
                <div className="lg:w-1/2 relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[250px] md:min-h-[400px] group">
                  <Image
                    src={tech.image}
                    alt={tech.category}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div
                        className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: tech.color }}
                      >
                        <CategoryIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-white">{tech.category}</h3>
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div className="lg:w-1/2 flex flex-col justify-center">
                  <div className="space-y-4 md:space-y-6">
                    {tech.features.map((feature, featureIndex) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <motion.div
                          key={feature.title}
                          className="flex gap-3 md:gap-5 p-4 md:p-6 bg-white/10 rounded-xl md:rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all"
                          initial={{ opacity: 0, x: isReversed ? -20 : 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: featureIndex * 0.1 }}
                        >
                          <div 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${tech.color}20` }}
                          >
                            <FeatureIcon className="w-5 h-5 md:w-6 md:h-6" style={{ color: tech.color }} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base md:text-xl mb-1 md:mb-2">{feature.title}</h4>
                            <p className="text-white/70 text-sm md:text-lg leading-relaxed">{feature.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
