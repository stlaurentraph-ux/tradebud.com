"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Leaf, 
  Cloud, 
  Droplets, 
  TreePine, 
  Recycle, 
  Link2, 
  Calculator, 
  MapPin, 
  ClipboardList,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const esrsTopics = [
  { code: "E1", title: "Climate Change", icon: Cloud },
  { code: "E2", title: "Pollution", icon: Leaf },
  { code: "E3", title: "Water Resources", icon: Droplets },
  { code: "E4", title: "Biodiversity", icon: TreePine },
  { code: "E5", title: "Circular Economy", icon: Recycle },
];

const triadApproach = [
  {
    title: "SAI FSA Questionnaire",
    subtitle: "Data Structure",
    description: "Farm Sustainability Assessment aligned forms that benchmark on-farm sustainability globally.",
    icon: ClipboardList,
    partner: "SAI Platform",
    // Farm-level assessment / field data (FSA-style on-farm survey context)
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "AgStack GeoID",
    subtitle: "Spatial Registry",
    description: "Open-source Asset Registry generating standardized, anonymous farm identifiers.",
    icon: MapPin,
    partner: "Linux Foundation",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=2073&auto=format&fit=crop",
  },
  {
    title: "Cool Farm Tool API",
    subtitle: "Calculation Engine",
    description: "Science-based calculator for GHG emissions, soil carbon, water use, and biodiversity.",
    icon: Calculator,
    partner: "Cool Farm Alliance",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=2070&auto=format&fit=crop",
  },
];

export function EsgClimate() {
  return (
    <section id="esg" className="py-32 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <Badge className="mb-6 bg-[var(--data-emerald)]/10 text-[var(--forest-canopy)] border-[var(--data-emerald)]/30 hover:bg-[var(--data-emerald)]/20 text-base px-5 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance tracking-tight">
            Corporate ESG, Climate & Biodiversity
          </h2>
          <p className="text-foreground/80 text-xl md:text-2xl max-w-3xl mx-auto text-balance leading-relaxed">
            Future-proof your supply chain with farm-level environmental metrics aligned with ESRS, SBTi FLAG guidance, and global ESG platforms.
          </p>
          <p className="text-foreground/70 text-base md:text-lg max-w-3xl mx-auto mt-5 leading-relaxed">
            Under ESPR, many coffee and cocoa supply chains are not subject to a mandatory Digital Product Passport—Tracebud still
            implements <span className="font-semibold text-foreground">DPP-style data rails</span> (EPCIS-friendly events, audit
            packs) so buyers can meet corporate ESG and disclosure expectations early.
          </p>
        </motion.div>

        {/* Hero Image with ESG Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-20 rounded-3xl overflow-hidden"
        >
          <div className="relative h-48 sm:h-64 md:h-[400px]">
            <Image
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2132&auto=format&fit=crop"
              alt="Sustainable agriculture landscape"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)] via-[var(--forest-canopy)]/40 to-transparent" />
          </div>
          <div className="p-6 md:p-10 bg-[var(--forest-canopy)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
                <Link2 className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">ESG Platform Connectors</h3>
                <p className="text-white/80 text-base">REST APIs pushing verified data into major ESG platforms</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {["EcoVadis", "Sustainalytics", "CDP", "GS1 EPCIS"].map((platform) => (
                <div
                  key={platform}
                  className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold border border-white/20"
                >
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ESRS Environmental Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
            ESRS Environmental Topics
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {esrsTopics.map((topic, index) => (
              <motion.div
                key={topic.code}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="flex items-center gap-3 bg-card rounded-full px-6 py-4 border border-border hover:border-[var(--data-emerald)] transition-colors group"
              >
                <div className="p-2 bg-[var(--data-emerald)]/10 rounded-full group-hover:bg-[var(--data-emerald)]/20 transition-colors">
                  <topic.icon className="w-5 h-5 text-[var(--forest-canopy)]" />
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{topic.code}</span>
                <span className="font-bold text-foreground">{topic.title}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Data Collection Triad - Card Grid with Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center text-foreground">
            Data Collection & Calculation Architecture
          </h3>
          <p className="text-foreground/70 text-lg text-center mb-10 max-w-2xl mx-auto">
            A triad approach to capture and verify climate and biodiversity metrics at farm level
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {triadApproach.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 * index }}
                className="group rounded-3xl overflow-hidden bg-card border border-border"
              >
                <div className="relative h-48 sm:h-52">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
                      {item.partner}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[var(--data-emerald)]/10 rounded-xl">
                      <item.icon className="w-5 h-5 text-[var(--forest-canopy)]" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--data-emerald)]">{item.subtitle}</p>
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SBTi FLAG Alignment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-card rounded-2xl px-8 py-6 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--data-emerald)]/10 rounded-lg">
                <Leaf className="w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-foreground">SBTi FLAG Guidance</p>
                <p className="text-sm text-muted-foreground">Land-based GHG emissions & carbon removals</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-border text-foreground hover:bg-muted"
            >
              Learn More <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
