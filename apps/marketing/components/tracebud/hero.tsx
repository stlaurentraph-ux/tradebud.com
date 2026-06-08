"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { useTranslations } from "next-intl";

export function Hero() {
  const waitlist = useWaitlistDialog();
  const t = useTranslations("marketing");

  return (
    <>
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
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

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.42fr)_minmax(0,0.58fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)] xl:gap-16">
            <motion.div
              className="min-w-0 lg:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-6 max-w-[44rem] text-pretty text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:max-w-none lg:text-5xl lg:leading-[1.08] xl:text-6xl xl:leading-tight">
                {t("hero.headline")}
              </h1>

              <p className="mb-3 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                {t("hero.subheadline")}
              </p>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                {t("hero.subheadlineSecondary")}
              </p>

              <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-8 py-6 text-base font-semibold text-[var(--forest-canopy)] hover:bg-white/90"
                  asChild
                >
                  <a href="#how-it-works">{t("hero.cta.primary")}</a>
                </Button>
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="rounded-full bg-[var(--data-emerald)] px-8 py-6 text-base font-semibold text-[var(--forest-canopy)] hover:bg-emerald-400"
                >
                  {t("hero.cta.secondary")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-white/60">{t("hero.supportingText")}</p>
            </motion.div>

            <motion.div
              className="relative flex justify-center lg:justify-end lg:pl-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-[280px] md:w-[320px] lg:w-[250px] xl:w-[320px]">
                <Image
                  src="/images/farmer-app-homepage.png"
                  alt="Tracebud Farmer App interface"
                  width={320}
                  height={693}
                  className="h-auto w-full"
                />

                <div className="absolute -left-8 top-1/4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">{t("hero.trustStrip.offline")}</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                  <div className="text-2xl font-bold text-[var(--forest-canopy)]">{t("hero.trustStrip.mapTime")}</div>
                  <div className="text-xs text-gray-500">{t("hero.trustStrip.mapTimeLabel")}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
