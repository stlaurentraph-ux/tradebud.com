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

      {/* Inclusion Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
                Compliance should not leave smallholders behind.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                Big companies can buy complex systems. Smallholders should not be excluded because the tools are too expensive, too technical, or too slow. Tracebud keeps every actor visible, connected, and ready for the market.
              </p>
              <p className="text-xl md:text-2xl font-semibold text-[var(--forest-canopy)]">
                Same chain. Same proof. Different access barriers — solved.
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
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/country-hero.jpg"
            alt="Agricultural landscape"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/85 to-[var(--forest-canopy)]/75" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-balance">
              Make compliance usable for the whole chain.
            </h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto">
              Start with the network you already have, and give every actor a way to participate.
            </p>
            <Button
              size="lg"
              onClick={() => waitlist.setOpen(true)}
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold px-10 py-7 text-lg rounded-full"
            >
              Get started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
