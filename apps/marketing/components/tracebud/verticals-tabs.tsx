"use client";

import { motion, AnimatePresence } from "framer-motion";
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
    title: "Farmers",
    fullTitle: "Farmers & Smallholders",
    hook: "Keep selling to EU buyers.",
    description: "Map your farm once. Use that proof for any EU buyer, forever. Free. Works offline in your field.",
    features: ["One walk around your field", "Proof that works forever", "Any EU buyer accepts it", "Free, always"],
    icon: Users,
    featureIcon: Smartphone,
    color: "var(--data-emerald)",
    href: "#",
    image: "/images/farmer-hero.jpg",
    cta: "Join the waitlist",
    ctaHref: "#waitlist",
    isAppUser: true,
  },
  {
    id: "cooperatives",
    title: "Cooperatives",
    fullTitle: "Cooperatives & Producer Groups",
    hook: "Get 500 farmers ready for December.",
    description: "All your members map once. You manage it from one dashboard. By December, everyone's compliant and ready to sell.",
    features: ["See all members at a glance", "Know who's mapped, who needs help", "Exporters get buyer-ready proof", "Takes a week, not three months"],
    icon: Handshake,
    featureIcon: Users,
    color: "#F59E0B",
    href: "#",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop",
    cta: "Join the waitlist",
    ctaHref: "#waitlist",
    isAppUser: false,
  },
  {
    id: "exporters",
    title: "Exporters",
    fullTitle: "Exporters & Operators",
    hook: "Ship faster. Zero rejected shipments.",
    description: "Proof comes upstream, already verified. You bundle it into buyer-ready documents. Customs approves. You move product.",
    features: ["Proof arrives upstream verified", "No more scrambling for docs", "Shipments sail, not stall", "Sleep at night"],
    icon: Truck,
    featureIcon: FileCheck,
    color: "var(--mountain-clay)",
    href: "#",
    image: "/images/exporter-hero.jpg",
    cta: "Join the waitlist",
    ctaHref: "#waitlist",
    isAppUser: false,
  },
  {
    id: "importers",
    title: "Importers",
    fullTitle: "Importers & Brands",
    hook: "Know every shipment is clean.",
    description: "See all your suppliers' proof upstream. Audit-ready whenever you need it. No more surprises. Sleep at night.",
    features: ["Full view of every supplier", "Proof ready before you need it", "Auditors ask, you answer", "Peace of mind"],
    icon: Building2,
    featureIcon: Eye,
    color: "var(--forest-canopy)",
    href: "#",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop",
    cta: "Join the waitlist",
    ctaHref: "#waitlist",
    isAppUser: false,
  },
  {
    id: "countries",
    title: "Countries",
    fullTitle: "Countries & National Programs",
    hook: "Unlock €50B in market access for your farmers.",
    description: "Give your farmers a tool to prove compliance. Protect your farmers' access to EU markets. They keep their livelihoods. You keep your exports.",
    features: ["Your farmers get market access", "Your nation stays competitive", "Proof is sovereign data", "Built for your needs"],
    icon: Globe,
    featureIcon: Server,
    color: "#8B5CF6",
    href: "#",
    image: "/images/country-hero.jpg",
    cta: "Contact Us",
    ctaHref: "mailto:hello@tracebud.com",
    isAppUser: false,
  },
];

export function VerticalsTabs() {
  const [activeId, setActiveId] = useState("farmers");
  const activeVertical = verticals.find((v) => v.id === activeId) || verticals[0];
  const Icon = activeVertical.icon;
  const FeatureIcon = activeVertical.featureIcon;

  return (
    <section id="stakeholders" className="py-20 md:py-28 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-3">
            Built for Everyone in the Chain
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            What success looks like for you
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Whether you grow coffee, manage a cooperative, ship containers, or source for EU brands—Tracebud fits your workflow.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
          {verticals.map((vertical) => {
            const TabIcon = vertical.icon;
            const isActive = activeId === vertical.id;
            return (
              <button
                key={vertical.id}
                onClick={() => setActiveId(vertical.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm md:text-base transition-all ${
                  isActive
                    ? "text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={isActive ? { backgroundColor: vertical.color } : {}}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{vertical.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-3xl overflow-hidden shadow-xl"
            style={{ borderLeft: `4px solid ${activeVertical.color}` }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={activeVertical.image}
                alt={activeVertical.fullTitle}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect fill='%23228B67' width='100%25' height='100%25'/%3E%3C/svg%3E"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${activeVertical.color}ee 0%, ${activeVertical.color}cc 40%, rgba(0,0,0,0.6) 100%)`,
                }}
              />
            </div>

            {/* Content */}
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8 min-h-[320px]">
              <div className="flex-1">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                  >
                    <FeatureIcon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {activeVertical.fullTitle}
                </h3>

                <p className="text-xl md:text-2xl font-semibold text-white/90 mb-3">
                  {activeVertical.hook}
                </p>

                <p className="text-white/80 text-base md:text-lg mb-6 max-w-xl">
                  {activeVertical.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {activeVertical.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 rounded-full text-sm text-white font-medium bg-white/20 backdrop-blur-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={activeVertical.ctaHref}>
                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors">
                      {activeVertical.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href={activeVertical.href}>
                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors">
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
