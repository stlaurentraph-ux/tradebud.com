"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog, WaitlistDialog } from "@/components/waitlist-dialog";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function ValueProp() {
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");

  return (
    <>
      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/exporter-hero.jpg"
            alt="Agricultural supply chain in action"
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
