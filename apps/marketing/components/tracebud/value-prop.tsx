"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Package, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog, WaitlistDialog } from "@/components/waitlist-dialog";
import Image from "next/image";

export function ValueProp() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Why Customers Use It */}
      <section className="py-24 md:py-32 bg-[var(--forest-canopy)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Why customers use Tracebud
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
              Reduce manual follow-up. Preserve provenance through aggregation. Ship with confidence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Fewer proof gaps",
                description: "Onboarding, evidence requests, duplicate checks, lineage, and DDS preparation in one connected system.",
              },
              {
                icon: Shield,
                title: "Provenance preserved",
                description: "Compliance proof tied to real producer, plot, batch, and shipment records. Not disconnected files.",
              },
              {
                icon: Users,
                title: "Faster handoff",
                description: "More confidence in what can actually ship. Less time chasing missing data when shipments need to move.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <item.icon className="w-10 h-10 text-[var(--data-emerald)] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/70 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters for Smallholders - Now with image */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
                Better compliance, better inclusion
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
                Built for fragmented, smallholder-heavy supply chains
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                By making origin proof easier to create and reuse, Tracebud helps keep smallholders visible, verifiable, and commercially connected to EU-bound supply chains—instead of being screened out by compliance friction.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/farmer-hero.jpg"
                  alt="Smallholder farmer using Tracebud"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => waitlist.setOpen(true)}
              className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold px-8 py-6 text-base rounded-full"
            >
              Join the waitlist
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Coffee First - with background image */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/country-hero.jpg"
            alt="Coffee field landscape"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-medium text-[var(--data-emerald)] tracking-wide uppercase mb-4">
                Starting with coffee
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-balance">
                Where smallholder complexity meets buyer demand
              </h2>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-6">
                Coffee supply chains have acute first-mile data gaps and immediate compliance pressure. That makes the product relevant now for cooperatives, exporters, roasters, and importers who need practical EUDR workflows—not generic sustainability software later.
              </p>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Beyond EUDR, the same infrastructure can support buyer-backed programmes around regenerative farming and fairer farmer income.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* EUDR Commodities Visual Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">7</div>
                  <div className="text-white/80 text-lg">EUDR Commodity Categories</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { name: "Coffee", active: true },
                    { name: "Cocoa", active: false },
                    { name: "Palm Oil", active: false },
                    { name: "Rubber", active: false },
                    { name: "Soy", active: false },
                    { name: "Cattle", active: false },
                    { name: "Timber", active: false },
                    { name: "More...", active: false },
                  ].map((commodity, i) => (
                    <div 
                      key={i} 
                      className={`px-4 py-3 rounded-lg text-sm font-medium text-center ${
                        commodity.active 
                          ? 'bg-[var(--data-emerald)] text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {commodity.name}
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">€50B</div>
                    <div className="text-xs text-white/60">EU market at stake</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">Dec &apos;26</div>
                    <div className="text-xs text-white/60">Full enforcement</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
