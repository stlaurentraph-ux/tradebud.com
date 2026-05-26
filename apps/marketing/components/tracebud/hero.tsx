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
      <section className="relative min-h-[90vh] flex items-center bg-[var(--warm-stone)]">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-medium text-[var(--forest-canopy)] tracking-wide uppercase mb-4">
                EUDR Compliance Made Simple
              </p>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--forest-canopy)] leading-tight mb-6 text-balance">
                The easiest way for smallholders to stay connected to EU markets
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl">
                From producer onboarding and plot mapping to shipment readiness and buyer handoff, Tracebud turns origin data into usable compliance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold px-8 py-6 text-base rounded-full"
                >
                  Join the waitlist
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] hover:bg-[var(--forest-canopy)] hover:text-white font-semibold px-8 py-6 text-base rounded-full"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Free for producers. No credit card required.
              </p>
            </motion.div>

            {/* Right: Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/farmer-hero.jpg"
                  alt="Farmer mapping their coffee plot with Tracebud mobile app"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="text-3xl font-bold text-[var(--forest-canopy)]">20 min</div>
                <div className="text-sm text-gray-500">to map one farm</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
              EUDR depends on farm-level proof, but that proof is still fragmented
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Evidence arrives late. Records are not reusable. Teams end up chasing missing data just when shipments need to move. The result is more manual work, more blocked shipments, and greater risk that smallholders are left out.
            </p>
          </motion.div>
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
              },
              {
                number: "2", 
                title: "Reuse everywhere",
                description: "Instead of rebuilding proof for every shipment, verified data flows across workflows. Map once, use forever.",
              },
              {
                number: "3",
                title: "Ship with confidence",
                description: "Fewer proof gaps, faster handoff, and more confidence in what can actually ship to EU markets.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-white rounded-2xl p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-5xl font-bold text-[var(--data-emerald)] mb-4">{item.number}</div>
                <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
