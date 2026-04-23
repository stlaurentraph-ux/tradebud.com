"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Submit to API
      fetch("/api/checklist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // Trigger PDF download
            const link = document.createElement("a");
            link.href = "/api/checklist/download";
            link.download = "EUDR-Compliance-Checklist.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setSubmitted(true);
            setEmail("");
            setTimeout(() => setSubmitted(false), 3000);
          }
        })
        .catch((err) => console.error("Error:", err));
    }
  };
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

        {/* Email Capture Form */}
        <motion.div
          className="max-w-md mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {!submitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3" aria-label="Get started with EUDR compliance checklist">
              <label htmlFor="hero-email" className="sr-only">Email address</label>
              <input
                id="hero-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
              />
              <Button
                type="submit"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 py-3 rounded-full whitespace-nowrap"
                aria-label="Get started - Download EUDR compliance checklist"
              >
                Get Started
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[var(--data-emerald)] font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Check your email!</span>
            </div>
          )}
          <p className="text-xs text-white/60 mt-3 text-center">
            Free EUDR compliance checklist included
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <a href="#supply-chain">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/80 text-white hover:bg-white/10 bg-transparent font-bold px-10 py-7 text-lg rounded-full"
            >
              How It Works
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
