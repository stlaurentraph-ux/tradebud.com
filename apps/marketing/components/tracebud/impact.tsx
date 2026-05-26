"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Users, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import Image from "next/image";

export function Impact() {
  const waitlist = useWaitlistDialog();

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-b from-[var(--forest-canopy)] to-[var(--forest-light)]">
      <div className="max-w-7xl mx-auto">
        {/* Header with image */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              From Offline Fields to Audit-Ready Proof
            </h2>
            <p className="text-white/90 text-xl md:text-2xl leading-relaxed">
              Portable origin data that works offline, gets verified offline, and moves upstream/downstream with full chain integrity.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
              <Image
                src="/images/exporter-hero.jpg"
                alt="Supply chain compliance in action"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/60 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20">
          {[
            { icon: CheckCircle2, title: "EUDR Compliant", description: "Audit-ready due diligence before December 2026 enforcement" },
            { icon: Users, title: "Farmer First", description: "Offline app captures plot proof where connectivity ends" },
            { icon: Zap, title: "Network Scale", description: "One request cascades to hundreds of suppliers automatically" },
            { icon: Globe, title: "Global Ready", description: "TRACES NT integration and 11-language support" },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 hover:border-[var(--data-emerald)]/50 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <item.icon className="w-10 h-10 md:w-12 md:h-12 text-[var(--data-emerald)] mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/70 text-sm md:text-base">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Use cases */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">Farmers and cooperatives are already using Tracebud to:</h3>
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {[
              "Map smallholder farms once, sell to any EU buyer forever",
              "Get 500 farmers compliant with one bulk request",
              "Import your whole supplier network and reach them all at once",
              "Ship without scrambling for documents at the last minute",
              "Know every shipment is clean before it leaves port",
              "Sleep at night knowing compliance is handled",
            ].map((useCase, index) => (
              <div key={index} className="flex items-start gap-3 md:gap-4">
                <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-[var(--data-emerald)] shrink-0 mt-0.5" />
                <p className="text-white/90 text-base md:text-lg">{useCase}</p>
              </div>
            ))}
          </div>
        </motion.div>
        {/* Final CTA */}
        <motion.div
          className="flex flex-col gap-6 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Button
            size="lg"
            onClick={() => waitlist.setOpen(true)}
            className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-10 py-7 text-lg rounded-full shadow-xl"
          >
            Join the waitlist
          </Button>
          <p className="text-white/70 text-sm">
            Be among the first to access the platform when it launches.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
