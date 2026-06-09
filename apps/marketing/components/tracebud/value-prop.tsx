"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Package, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function ValueProp() {
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");
  const tCustomers = useTranslations("marketing.customersSection");

  const customerCards = [
    { icon: Package, title: tCustomers("cards.gaps.title"), description: tCustomers("cards.gaps.description") },
    { icon: Shield, title: tCustomers("cards.provenance.title"), description: tCustomers("cards.provenance.description") },
    { icon: Users, title: tCustomers("cards.handoff.title"), description: tCustomers("cards.handoff.description") },
  ];

  return (
    <>
      {/* Why Customers Use It */}
      <section id="outcomes" className="scroll-mt-20 py-24 md:py-32 bg-[var(--forest-canopy)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--data-emerald)]">
              {tCustomers("eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {tCustomers("headline")}
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
              {tCustomers("description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {customerCards.map((item, index) => (
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
                {t("inclusionSection.headline")}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                {t("inclusionSection.description")}
              </p>
              <p className="text-xl md:text-2xl font-semibold text-[var(--forest-canopy)]">
                {t("inclusionSection.punchline")}
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
              {t("finalCtaSection.headline")}
            </h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto">
              {t("finalCtaSection.description")}
            </p>
            <Button
              size="lg"
              onClick={() => waitlist.setOpen(true)}
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold px-10 py-7 text-lg rounded-full"
            >
              {t("finalCtaSection.cta")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
