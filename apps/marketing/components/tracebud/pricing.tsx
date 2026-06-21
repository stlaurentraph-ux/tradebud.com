"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";

const plans = [
  {
    key: "starter",
    scale: "1–50 managed contacts",
    shipments: "€1 / leg",
    price: "€20",
    priceLabel: "/month",
    highlight: false,
  },
  {
    key: "growth",
    scale: "51–500 managed contacts",
    shipments: "€1 / leg",
    price: "€40",
    priceLabel: "/month",
    highlight: true,
  },
  {
    key: "scale",
    scale: "501–3,000 managed contacts",
    shipments: "€1 / leg",
    price: "€60",
    priceLabel: "/month",
    highlight: false,
  },
  {
    key: "enterprise",
    scale: "3,001+ managed contacts",
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
    <section id="pricing" className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--warm-stone)] via-white to-white" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            {t("pricingSection.label")}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6 text-balance leading-[1.1]">
            {t("pricingSection.headline")}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            {t("pricingSection.description")}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              className={`relative rounded-3xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? "bg-[var(--forest-canopy)] text-white shadow-2xl scale-[1.02] lg:scale-105"
                  : "bg-white border-2 border-gray-100 hover:border-[var(--data-emerald)]/30 hover:shadow-lg"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--data-emerald)] text-[var(--forest-canopy)] shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("pricingSection.popularBadge")}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className={`text-lg font-bold mb-2 ${plan.highlight ? "text-white" : "text-[var(--forest-canopy)]"}`}>
                {t(`pricingSection.plans.${plan.key}.name`)}
              </h3>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-[var(--forest-canopy)]"}`}>
                  {plan.price}
                </span>
                {plan.priceLabel && (
                  <span className={`text-base ${plan.highlight ? "text-white/60" : "text-gray-500"}`}>
                    {plan.priceLabel}
                  </span>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.highlight ? "text-[var(--data-emerald)]" : "text-[var(--data-emerald)]"}`} />
                  <span className={`text-sm ${plan.highlight ? "text-white/80" : "text-gray-600"}`}>
                    {plan.scale}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.highlight ? "text-[var(--data-emerald)]" : "text-[var(--data-emerald)]"}`} />
                  <span className={`text-sm ${plan.highlight ? "text-white/80" : "text-gray-600"}`}>
                    {plan.shipments} {t("pricingSection.table.shipments").toLowerCase()}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => waitlist.setOpen(true)}
                className={`w-full rounded-full py-6 font-semibold ${
                  plan.highlight
                    ? "bg-white text-[var(--forest-canopy)] hover:bg-white/90"
                    : "bg-[var(--forest-canopy)] text-white hover:bg-[var(--forest-light)]"
                }`}
              >
                {t("pricingSection.cta")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          className="text-center text-sm text-gray-500 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t("pricingSection.footerNote")}
        </motion.p>
      </div>
    </section>
  );
}
