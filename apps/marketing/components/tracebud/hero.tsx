"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Hero() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Farmer in coffee field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
                EUDR Compliance Made Simple
              </p>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
                The easiest way for smallholders to stay connected to EU markets
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                From producer onboarding and plot mapping to shipment readiness and buyer handoff, Tracebud turns origin data into usable compliance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold px-8 py-6 text-base rounded-full"
                >
                  Join the waitlist
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-base rounded-full"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <p className="text-sm text-white/60">
                Free for producers. No credit card required.
              </p>
            </motion.div>

            {/* Right: App Screenshot (no phone frame) */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-[280px] md:w-[320px]">
                {/* App screenshot with subtle shadow and rounded corners */}
                <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20">
                  <Image
                    src="/images/farmer-app-homepage.png"
                    alt="Tracebud Farmer App interface"
                    width={320}
                    height={693}
                    className="w-full h-auto"
                  />
                </div>

                {/* Floating badges */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">Works Offline</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="text-2xl font-bold text-[var(--forest-canopy)]">20 min</div>
                  <div className="text-xs text-gray-500">to map a farm</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
                EUDR depends on farm-level proof, but that proof is still fragmented
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Evidence arrives late. Records are not reusable. Teams end up chasing missing data just when shipments need to move. The result is more manual work, more blocked shipments, and greater risk that smallholders are left out.
              </p>
            </motion.div>

            {/* Right: Visual showing fragmentation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                <Image
                  src="/images/gis-geolocation.jpg"
                  alt="Complex supply chain mapping"
                  fill
                  className="object-cover rounded-3xl"
                />
                {/* Overlay cards showing fragmentation */}
                <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-red-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-gray-700">Records scattered</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-gray-700">Evidence arrives late</span>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-8 bg-white rounded-xl shadow-lg p-3 border border-orange-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-gray-700">Not reusable</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 md:py-32 bg-[var(--warm-stone)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
              What Tracebud changes
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              One shared workflow to request, collect, verify, and reuse origin proof. The process can start anywhere in the chain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Create proof once",
                description: "Producers and field teams capture GPS boundaries, photos, and consent directly from the farm. Works offline.",
                image: "/images/feature-offline-mapping.jpg",
              },
              {
                number: "2", 
                title: "Reuse everywhere",
                description: "Instead of rebuilding proof for every shipment, verified data flows across workflows. Map once, use forever.",
                image: "/images/feature-photo-vault.jpg",
              },
              {
                number: "3",
                title: "Ship with confidence",
                description: "Fewer proof gaps, faster handoff, and more confidence in what can actually ship to EU markets.",
                image: "/images/feature-declaration.jpg",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Image */}
                <div className="relative w-full aspect-video bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Content */}
                <div className="p-8">
                  <div className="text-5xl font-bold text-[var(--data-emerald)] mb-4">{item.number}</div>
                  <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
