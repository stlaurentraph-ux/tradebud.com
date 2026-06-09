"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqItems = [
  { key: "whenLaunch", question: "whenLaunch", answer: "whenLaunchAnswer" },
  { key: "whyCommodities", question: "whyCommodities", answer: "whyCommoditiesAnswer" },
  { key: "howCost", question: "howCost", answer: "howCostAnswer" },
  { key: "howLong", question: "howLong", answer: "howLongAnswer" },
  { key: "support", question: "support", answer: "supportAnswer" },
];

export function FAQ() {
  const t = useTranslations("faq");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id="faq" className="scroll-mt-20 py-20 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isExpanded = expandedId === item.key;

            return (
              <motion.div
                key={item.key}
                className="border border-border rounded-lg overflow-hidden bg-card hover:border-[var(--data-emerald)]/30 transition-colors"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                {/* Question Button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.key)}
                  className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">
                    {t(item.question)}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5 bg-muted/30 text-muted-foreground">
                        {t(item.answer)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
