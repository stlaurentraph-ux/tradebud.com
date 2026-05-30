"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Package, Shield, Zap, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog, WaitlistDialog } from "@/components/waitlist-dialog";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function ValueProp() {
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");

  return (
    <>
      {/* Why Customers Use It */}
      <section className="py-24 md:py-32 bg-[var(--forest-canopy)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--data-emerald)]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--data-emerald)]/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
              Why Tracebud
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Why customers use Tracebud
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Reduce manual follow-up. Preserve provenance through aggregation. Ship with confidence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Fewer proof gaps",
                description: "Onboarding, evidence requests, duplicate checks, lineage, and DDS preparation in one connected system.",
                stat: "60%",
                statLabel: "less manual work",
              },
              {
                icon: Shield,
                title: "Provenance preserved",
                description: "Compliance proof tied to real producer, plot, batch, and shipment records. Not disconnected files.",
                stat: "100%",
                statLabel: "audit ready",
              },
              {
                icon: Clock,
                title: "Faster handoff",
                description: "More confidence in what can actually ship. Less time chasing missing data when shipments need to move.",
                stat: "3x",
                statLabel: "faster export",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--data-emerald)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-[var(--forest-canopy)]" />
                </div>

                {/* Stat */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[var(--data-emerald)]">{item.stat}</span>
                  <span className="text-sm text-white/50 ml-2">{item.statLabel}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inclusion Section */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
                Inclusive by design
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance leading-[1.1]">
                {t("inclusionSection.headline")}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                {t("inclusionSection.description")}
              </p>
              
              {/* Quote/Punchline */}
              <div className="relative pl-6 border-l-4 border-[var(--data-emerald)]">
                <p className="text-xl md:text-2xl font-bold text-[var(--forest-canopy)] italic">
                  {t("inclusionSection.punchline")}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/exporter-hero.jpg"
                  alt="Coffee exporter preparing shipment"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/40 via-transparent to-transparent" />
              </div>
              
              {/* Floating badge */}
              <motion.div
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[var(--data-emerald)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[var(--forest-canopy)]">Free</div>
                    <div className="text-sm text-gray-500">For all producers</div>
                  </div>
                </div>
              </motion.div>
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
          <div className="absolute inset-0 bg-[var(--forest-canopy)]/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
              Get started today
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-balance leading-[1.1]">
              {t("finalCtaSection.headline")}
            </h2>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">
              {t("finalCtaSection.description")}
            </p>
            <Button
              size="lg"
              onClick={() => waitlist.setOpen(true)}
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-12 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {t("finalCtaSection.cta")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
