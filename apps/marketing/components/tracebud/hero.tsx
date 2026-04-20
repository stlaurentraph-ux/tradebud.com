"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--forest-canopy)]/80 via-[var(--forest-canopy)]/70 to-[var(--forest-canopy)]/90" />
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
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 text-balance leading-tight">
            Trade Freely. <span className="text-[var(--data-emerald)]">Trace Easily.</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          The simplest way to connect sustainable farms to global markets. We handle the complex compliance so you can focus on the harvest and the business.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-5 justify-center items-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <a href="/pilot">
            <Button
              size="lg"
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-10 py-7 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              Apply for pilot
            </Button>
          </a>
          <a href="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/80 text-white hover:bg-white/10 bg-transparent font-bold px-10 py-7 text-xl rounded-full"
            >
              See how it works
            </Button>
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#how-it-works"
          className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        >
          <ArrowDown className="w-8 h-8 text-white/70" />
        </motion.a>
      </div>
    </section>
  );
}
