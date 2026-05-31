"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sprout, TrendingUp, Leaf, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog, WaitlistDialog } from "@/components/waitlist-dialog";

export function RegenerativeFarming() {
  const t = useTranslations("marketing");
  const waitlist = useWaitlistDialog();

  return (
    <>
      <section className="relative py-24 md:py-32 bg-white overflow-hidden">
        {/* Decorative leaf pattern */}
        <div className="absolute top-0 left-0 w-64 h-64 opacity-5">
          <Sprout className="w-full h-full text-[var(--forest-canopy)]" />
        </div>
        <div className="absolute bottom-0 right-0 w-48 h-48 opacity-5 rotate-180">
          <Leaf className="w-full h-full text-[var(--forest-canopy)]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: Image */}
            <motion.div
              className="order-2 lg:order-1 relative"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/country-hero.jpg"
                  alt="Regenerative coffee farming practices"
                  fill
                  className="object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-canopy)]/60 via-transparent to-transparent" />
                
                {/* Stat overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[var(--data-emerald)]" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Track progress over time</div>
                        <div className="text-lg font-bold text-[var(--forest-canopy)]">Document regenerative transitions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-[var(--data-emerald)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase">
                  {t("regenerativeFarmingSection.label")}
                </p>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance leading-[1.1]">
                {t("regenerativeFarmingSection.headline")}
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                {t("regenerativeFarmingSection.description")}
              </p>

              <div className="bg-[var(--warm-stone)] rounded-2xl p-6 mb-8">
                <p className="text-base text-gray-700 leading-relaxed italic">
                  &ldquo;{t("regenerativeFarmingSection.benefit")}&rdquo;
                </p>
              </div>

              <Button
                onClick={() => waitlist.setOpen(true)}
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold px-8 py-6 text-base rounded-full"
              >
                Learn more about our approach
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
