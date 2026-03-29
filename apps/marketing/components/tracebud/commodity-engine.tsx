"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Coffee, Leaf, CircleDot, TreePine, Wheat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const commodities = [
  { 
    id: "coffee", 
    name: "Coffee", 
    hsCode: "0901",
    icon: Coffee, 
    color: "#78350F",
    description: "From Honduras to Europe, full polygon traceability for specialty and commercial grades.",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1961&auto=format&fit=crop"
  },
  { 
    id: "cocoa", 
    name: "Cocoa", 
    hsCode: "1801",
    icon: Leaf, 
    color: "#064E3B",
    description: "Agroforestry-aware mapping for West African and Latin American cocoa producers.",
    image: "https://images.unsplash.com/photo-1606913084603-3e7702b01627?q=80&w=2070&auto=format&fit=crop"
  },
  { 
    id: "rubber", 
    name: "Rubber", 
    hsCode: "4001",
    icon: CircleDot, 
    color: "#1F2937",
    description: "Plantation and smallholder mapping with deforestation baseline verification.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2032&auto=format&fit=crop"
  },
  { 
    id: "soy", 
    name: "Soy", 
    hsCode: "1201",
    icon: Wheat, 
    color: "#CA8A04",
    description: "Large-scale agricultural mapping with satellite AI pre-verification.",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "timber",
    name: "Timber",
    hsCode: "4407",
    icon: TreePine, 
    color: "#166534",
    description: "Forest management verification with protected area workflow integration.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop"
  },
];

export function CommodityEngine() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % commodities.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCommodity = commodities[activeIndex];
  const Icon = activeCommodity.icon;

  return (
    <section className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-6 tracking-tight">
            Commodity Agnostic
          </h2>
          <p className="text-foreground/80 text-base md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Dynamic data schema with HS Code + Risk Matrix. One platform for all EUDR-covered commodities.
          </p>
        </motion.div>

        {/* Commodity showcase with image */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          {/* Image side */}
          <motion.div
            className="relative w-full aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCommodity.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={activeCommodity.image}
                  alt={activeCommodity.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCommodity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div 
                      className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: activeCommodity.color }}
                    >
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-white">
                        {activeCommodity.name}
                      </h3>
                      <span className="text-white/60 font-mono text-sm md:text-base">HS {activeCommodity.hsCode}</span>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm md:text-lg leading-relaxed">
                    {activeCommodity.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stats and toggle side */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Toggle buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6 md:mb-10">
              {commodities.map((commodity, index) => {
                const CommodityIcon = commodity.icon;
                return (
                  <button
                    key={commodity.id}
                    onClick={() => setActiveIndex(index)}
                    className={`px-2 sm:px-3 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-[10px] sm:text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                      index === activeIndex
                        ? "text-white shadow-xl scale-105"
                        : "bg-muted text-foreground/70 hover:bg-muted/80"
                    }`}
                    style={{
                      backgroundColor:
                        index === activeIndex ? commodity.color : undefined,
                    }}
                  >
                    <CommodityIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{commodity.name}</span>
                    <span className="sm:hidden">{commodity.name.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
              {[
                { label: "Countries", value: "12+" },
                { label: "Commodities", value: "5" },
                { label: "Farms", value: "50K+" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-card border border-border rounded-lg md:rounded-2xl p-2 sm:p-3 md:p-6 text-center shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="text-lg sm:text-xl md:text-4xl font-bold text-foreground mb-0.5 md:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-foreground/60 text-[9px] sm:text-xs md:text-sm font-medium leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/farmers" className="block">
              <Button
                size="lg"
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-4 md:px-8 py-3 md:py-6 text-xs sm:text-sm md:text-lg rounded-full w-full"
              >
                Start Mapping Your Commodity
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
