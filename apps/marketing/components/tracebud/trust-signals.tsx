'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrustSignals() {
  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Product Reality Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-3">What You'll Actually Use</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--forest-canopy)] mb-4">
              Real Product. Almost Ready.
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              No vaporware. The platform is built. Here's what early adopters are getting.
            </p>
          </div>

          {/* Product Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: 'Plot Registration',
                description: 'Farmers walk their boundary once. GPS coordinates captured in 60 seconds with satellite imagery for verification.'
              },
              {
                title: 'Compliance Engine',
                description: 'Automated deforestation checks against Dec 31, 2020 baseline. Flags degradation and missing documents before shipment.'
              },
              {
                title: 'Document Vault',
                description: 'OCR scans titles and land tenure documents. Supports informal tenure with FPIC records and community agreements.'
              },
              {
                title: 'Audit Trail',
                description: '5-year immutable records with timestamps. Identity-preserving batches—no anonymizing farmers out of audits.'
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-xl bg-[var(--forest-canopy)]/5 border border-[var(--forest-canopy)]/10 hover:border-[var(--data-emerald)]/30 transition-all"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <h3 className="font-bold text-[var(--forest-canopy)] mb-2 text-lg">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Direct Access Section */}
        <motion.div
          className="max-w-3xl mx-auto text-center bg-gradient-to-r from-[var(--forest-canopy)] to-[var(--data-emerald)] rounded-3xl p-10 md:p-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Talk Directly with the Founder
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            No sales team. No waiting. Book 15 minutes to see the product, ask questions, or just chat about your compliance challenges.
          </p>
          
          <a href="https://calendly.com/yourprofile/15min" target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg"
              className="bg-white text-[var(--forest-canopy)] hover:bg-gray-100 font-bold px-10 py-7 text-lg rounded-full shadow-xl"
            >
              <Calendar className="w-5 h-5 mr-3" />
              Schedule a Call
            </Button>
          </a>

          <p className="text-white/70 text-sm mt-6">
            Available for 15-min calls. Typically respond within 24 hours.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
