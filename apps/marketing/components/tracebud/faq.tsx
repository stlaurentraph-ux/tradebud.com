"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";

const faqItems = [
  { key: "whenLaunch", question: "whenLaunch", answer: "whenLaunchAnswer" },
  { key: "whyCommodities", question: "whyCommodities", answer: "whyCommoditiesAnswer" },
  { key: "howLong", question: "howLong", answer: "howLongAnswer" },
  { key: "offlineCapability", question: "offlineCapability", answer: "offlineCapabilityAnswer" },
  { key: "dataControl", question: "dataControl", answer: "dataControlAnswer" },
  { key: "regenerativeFarming", question: "regenerativeFarming", answer: "regenerativeFarmingAnswer" },
  { key: "whoItIsFor", question: "whoItIsFor", answer: "whoItIsForAnswer" },
  { key: "support", question: "support", answer: "supportAnswer" },
];

export function FAQ() {
  const t = useTranslations("faq");
  const [expandedId, setExpandedId] = useState<string | null>("whenLaunch");
  const waitlist = useWaitlistDialog();

  return (
    <section className="py-24 md:py-32 bg-[var(--warm-stone)]">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-[var(--data-emerald)] tracking-wide uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-4 text-balance">
            {t("title")}
          </h2>
        </motion.div>

        {/* FAQ Items - Two columns on desktop */}
        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {faqItems.map((item, index) => {
            const isExpanded = expandedId === item.key;

            return (
              <motion.div
                key={item.key}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all duration-300 ${
                  isExpanded ? "border-[var(--data-emerald)]" : "border-transparent hover:border-gray-200"
                }`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.key)}
                  className="w-full flex items-start justify-between gap-4 p-6 text-left"
                >
                  <span className="font-semibold text-[var(--forest-canopy)] pr-4 leading-snug">
                    {t(item.question)}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[var(--warm-stone)] flex items-center justify-center"
                  >
                    <ChevronDown className="w-4 h-4 text-[var(--forest-canopy)]" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                        {t(item.answer)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Card */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-[var(--forest-canopy)] p-10 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--data-emerald)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--data-emerald)]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--data-emerald)] flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-7 h-7 text-[var(--forest-canopy)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Still have questions?</h3>
                <p className="text-white/70">Join the waitlist and we will be in touch.</p>
              </div>
            </div>
            <Button
              onClick={() => waitlist.setOpen(true)}
              className="bg-white hover:bg-white/90 text-[var(--forest-canopy)] font-bold px-10 py-6 text-base rounded-full shrink-0"
            >
              Join the waitlist
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
