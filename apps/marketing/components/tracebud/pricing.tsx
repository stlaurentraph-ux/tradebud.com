"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog, WaitlistDialog } from "@/components/waitlist-dialog";

const plans = [
  {
    key: "starter",
    scale: "1–50 producers or 1–5 orgs",
    shipments: "10",
    price: "€19",
    priceLabel: "/month",
    highlight: false,
  },
  {
    key: "growth",
    scale: "51–500 producers or 6–25 orgs",
    shipments: "50",
    price: "€49",
    priceLabel: "/month",
    highlight: true,
  },
  {
    key: "scale",
    scale: "501–3,000 producers or 26–100 orgs",
    shipments: "150",
    price: "€99",
    priceLabel: "/month",
    highlight: false,
  },
  {
    key: "enterprise",
    scale: "3,000+ producers or 100+ orgs",
    shipments: "Custom",
    price: "Custom",
    priceLabel: "",
    highlight: false,
  },
] as const;

export function Pricing() {
  const t = useTranslations("marketing");
  const waitlist = useWaitlistDialog();

  return (
    <section id="pricing" className="py-24 md:py-32 bg-[var(--warm-stone)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="max-w-2xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            {t("pricingSection.label")}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-4 text-balance">
            {t("pricingSection.headline")}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {t("pricingSection.description")}
          </p>
        </motion.div>

        {/* Pricing table — desktop */}
        <motion.div
          className="hidden md:block overflow-hidden rounded-2xl border border-[var(--warm-stone-dark)] bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Table header */}
          <div className="grid grid-cols-4 border-b border-[var(--warm-stone-dark)] bg-[var(--forest-canopy)]">
            <div className="px-8 py-5 text-sm font-semibold text-white/70 uppercase tracking-wide">
              {t("pricingSection.table.plan")}
            </div>
            <div className="px-8 py-5 text-sm font-semibold text-white/70 uppercase tracking-wide">
              {t("pricingSection.table.managedScale")}
            </div>
            <div className="px-8 py-5 text-sm font-semibold text-white/70 uppercase tracking-wide">
              {t("pricingSection.table.shipments")}
            </div>
            <div className="px-8 py-5 text-sm font-semibold text-white/70 uppercase tracking-wide">
              {t("pricingSection.table.monthlyBase")}
            </div>
          </div>

          {/* Table rows */}
          {plans.map((plan, index) => (
            <div
              key={plan.key}
              className={`grid grid-cols-4 border-b border-[var(--warm-stone-dark)] last:border-0 transition-colors ${
                plan.highlight
                  ? "bg-[var(--forest-canopy)]/5"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="px-8 py-6 flex items-center gap-3">
                {plan.highlight && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--data-emerald)] text-white">
                    {t("pricingSection.popularBadge")}
                  </span>
                )}
                <span className={`text-base font-bold ${plan.highlight ? "text-[var(--forest-canopy)]" : "text-[var(--forest-canopy)]"}`}>
                  {t(`pricingSection.plans.${plan.key}.name`)}
                </span>
              </div>
              <div className="px-8 py-6 flex items-center">
                <span className="text-sm text-gray-600">{plan.scale}</span>
              </div>
              <div className="px-8 py-6 flex items-center">
                <span className="text-sm font-medium text-[var(--forest-canopy)]">{plan.shipments}</span>
              </div>
              <div className="px-8 py-6 flex items-center">
                <span className="text-xl font-bold text-[var(--forest-canopy)]">
                  {plan.price}
                  {plan.priceLabel && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{plan.priceLabel}</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pricing cards — mobile */}
        <div className="flex flex-col gap-4 md:hidden">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-[var(--data-emerald)] bg-white shadow-md"
                  : "border-[var(--warm-stone-dark)] bg-white"
              }`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--forest-canopy)]">
                    {t(`pricingSection.plans.${plan.key}.name`)}
                  </span>
                  {plan.highlight && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--data-emerald)] text-white">
                      {t("pricingSection.popularBadge")}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold text-[var(--forest-canopy)]">
                  {plan.price}
                  {plan.priceLabel && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{plan.priceLabel}</span>
                  )}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--data-emerald)] mt-0.5 shrink-0" />
                  <span>{plan.scale}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--data-emerald)] mt-0.5 shrink-0" />
                  <span>
                    {plan.shipments} {t("pricingSection.table.shipments").toLowerCase()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note + CTA */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            {t("pricingSection.footerNote")}
          </p>
          <Button
            onClick={() => waitlist.setOpen(true)}
            className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold px-8 py-3 rounded-full shrink-0"
          >
            {t("pricingSection.cta")}
          </Button>
        </motion.div>
      </div>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </section>
  );
}
