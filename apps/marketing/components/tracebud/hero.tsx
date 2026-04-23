"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getCreateAccountUrl } from "@/lib/dashboard";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=2073&auto=format&fit=crop"
          alt="Lush green coffee plantation with mountains in the background"
          fill
          className="object-cover"
          priority
          loading="eager"
        />
        {/* Dark overlay for text readability - reduced opacity to show imagery */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--forest-canopy)]/60 via-[var(--forest-canopy)]/50 to-[var(--forest-canopy)]/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        {/* EUDR Deadline Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-[var(--mountain-clay)] text-white px-5 py-2.5 rounded-full text-lg font-bold mb-8"
        >
          <Calendar className="w-5 h-5" />
          <span>EUDR: Dec 30, 2026 (large/medium) · Jun 30, 2027 (micro/small)</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 text-balance leading-tight">
            Trade Freely.
            <br />
            <span className="text-[var(--data-emerald)]">Trace Easily.</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          EU market access made simple. Full supply chain traceability in days, not months.
        </motion.p>

        {/* Value Metrics */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 md:gap-12 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">Days</div>
            <div className="text-sm md:text-base text-white/70">Not months to compliance</div>
          </div>
          <div className="hidden sm:block w-px bg-white/20 h-12 self-center" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">Full Chain</div>
            <div className="text-sm md:text-base text-white/70">Farm to port verified</div>
          </div>
          <div className="hidden sm:block w-px bg-white/20 h-12 self-center" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">Self-serve</div>
            <div className="text-sm md:text-base text-white/70">No integration needed</div>
          </div>
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a href={getCreateAccountUrl()}>
            <Button
              size="lg"
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-10 py-7 text-lg rounded-full shadow-xl"
            >
              Start Free Trial
            </Button>
          </a>
          <a href="/demo">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/80 text-white hover:bg-white/10 bg-transparent font-bold px-10 py-7 text-lg rounded-full"
            >
              Book 15-min Demo
            </Button>
          </a>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <span className="text-sm text-white/70">30 days free. No credit card required.</span>
          <span className="hidden sm:block text-white/40">|</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-[var(--data-emerald)] font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Early adopters get priority support
          </span>
        </motion.div>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <a href="#supply-chain" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
            <span>See how it works</span>
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
