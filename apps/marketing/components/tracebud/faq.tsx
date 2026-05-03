"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Pricing & Trial",
    items: [
      {
        question: "Is the 30-day free trial really free?",
        answer: "Yes, completely free. No credit card required. You get full access to all dashboard features for 30 days. After the trial, you only pay if you continue using Tracebud, based on the number of organizations you oversee.",
      },
      {
        question: "How does pricing work after the trial?",
        answer: "After your free trial, you pay based on the number of unique organizations in your supply chain that you monitor. For example, an importer paying by supplier organization, or a cooperative paying by member organization. Contact sales for volume pricing.",
      },
      {
        question: "Can I cancel anytime?",
        answer: "Yes. You can cancel your subscription at any time with no long-term contracts. Your data remains accessible during the trial period.",
      },
    ],
  },
  {
    category: "Security & Data",
    items: [
      {
        question: "Is my data secure?",
        answer: "Tracebud uses enterprise-grade encryption (TLS 1.3), secure authentication, and row-level security (RLS) policies. All data is encrypted at rest and in transit. We comply with GDPR, ISO 27001, and other security standards.",
      },
      {
        question: "Who owns my data?",
        answer: "You own your data. Farmers can grant or revoke access to their plot data anytime. Cooperatives control member data. Exporters control supplier information. We never use your data for any purpose other than providing the service.",
      },
      {
        question: "Where is my data stored?",
        answer: "Data is stored in secure cloud infrastructure with redundancy and backups. Specific storage regions can be configured based on regulatory requirements (GDPR, data residency, etc.).",
      },
    ],
  },
  {
    category: "Compliance & Regulations",
    items: [
      {
        question: "Does Tracebud help with EUDR compliance?",
        answer: "Yes. Tracebud is purpose-built for EUDR compliance. We track deforestation risk, verify land rights, document supply chain evidence, and generate DDS (Due Diligence Statements) for EU submission. Our satellite integration flags deforestation automatically.",
      },
      {
        question: "What other regulations does Tracebud cover?",
        answer: "Beyond EUDR, Tracebud supports CSRD (Corporate Sustainability Reporting Directive), ILO due diligence, and emerging ESG frameworks. Compliance checks and reporting templates are built-in.",
      },
      {
        question: "Can I export compliance reports?",
        answer: "Yes. You can generate audit-ready reports, DDS packages, and compliance documentation directly from the platform. All reports include complete evidence chains and timestamps.",
      },
    ],
  },
  {
    category: "Product & Features",
    items: [
      {
        question: "Do I need to download an app, or is it web-based?",
        answer: "Tracebud offers both. Farmers get a mobile app (iOS/Android) with offline capability for GPS mapping and evidence collection. Exporters, Importers, and Cooperatives use the web dashboard. Both sync seamlessly.",
      },
      {
        question: "Can I integrate Tracebud with my existing systems?",
        answer: "Yes. Tracebud offers REST APIs and webhook support for integration with ERP systems, supply chain platforms, and compliance tools. Contact our team for integration specifications.",
      },
      {
        question: "Does Tracebud work offline?",
        answer: "Yes, the mobile app works fully offline. Farmers can map plots, take photos, and record harvests without internet. Data syncs automatically when connectivity is restored.",
      },
    ],
  },
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I get started?",
        answer: "Click 'Start Free Trial' to create your account. Choose your role (Producer, Cooperative, Exporter, or Importer) and you'll have instant access to the full dashboard for 30 days. No setup required.",
      },
      {
        question: "Do I need a demo first?",
        answer: "No, you can jump right into the free trial. However, if you want a personalized walkthrough or have complex requirements, you can book a 15-minute demo with our team.",
      },
      {
        question: "What if I have more questions?",
        answer: "Contact our support team at support@tracebud.com or use the in-app chat. We typically respond within 24 hours.",
      },
    ],
  },
];

export function FAQ() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--data-emerald)]">
            Common Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Tracebud, pricing, security, and compliance.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
            >
              {/* Category Title */}
              <h3 className="text-xl font-bold text-foreground mb-4">
                {category.category}
              </h3>

              {/* FAQ Items */}
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const itemId = `${category.category}-${itemIndex}`;
                  const isExpanded = expandedId === itemId;

                  return (
                    <motion.div
                      key={itemId}
                      className="border border-border rounded-lg overflow-hidden bg-card hover:border-[var(--data-emerald)]/30 transition-colors"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: itemIndex * 0.05 }}
                    >
                      {/* Question Button */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : itemId)
                        }
                        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-semibold text-foreground pr-4">
                          {item.question}
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
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <motion.div
          className="mt-16 p-8 rounded-xl bg-[var(--data-emerald)]/10 border border-[var(--data-emerald)]/20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-foreground font-semibold mb-2">
            Didn&apos;t find your answer?
          </p>
          <p className="text-muted-foreground mb-4">
            Reach out to our team at{" "}
            <a
              href="mailto:support@tracebud.com"
              className="text-[var(--data-emerald)] font-semibold hover:underline"
            >
              support@tracebud.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
