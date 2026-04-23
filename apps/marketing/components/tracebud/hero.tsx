"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowDown, CheckCircle2 } from "lucide-react";
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
            Send One Request.
            <br />
            <span className="text-[var(--data-emerald)]">Trace Your Entire Supply Chain.</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Upload your supplier contacts. Send a templated EUDR compliance request. It cascades upstream to the farmer. GPS coordinates, deforestation checks, and harvest data flow back—automatically through Tracebud.
        </motion.p>

        {/* Quantified Value Metrics */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 md:gap-10 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">2 min</div>
            <div className="text-sm md:text-base text-white/70">Create Account & Send Request</div>
          </div>
          <div className="hidden sm:block w-px bg-white/20 h-12 self-center" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">60s</div>
            <div className="text-sm md:text-base text-white/70">Plot Verification via App</div>
          </div>
          <div className="hidden sm:block w-px bg-white/20 h-12 self-center" />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--data-emerald)]">∞</div>
            <div className="text-sm md:text-base text-white/70">Supply Chain Depth</div>
          </div>
        </motion.div>

        {/* Email Capture Form */}
        <motion.div
          className="max-w-md mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          {!submitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--data-emerald)] focus:border-transparent"
              />
              <Button
                type="submit"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 py-3 rounded-full whitespace-nowrap"
              >
                Get Checklist
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[var(--data-emerald)] font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Check your email!</span>
            </div>
          )}
          <p className="text-xs text-white/60 mt-3 text-center">
            Get a free EUDR compliance checklist + implementation guide
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          <a href="/get-started">
            <Button
              size="lg"
              className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-10 py-7 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              Send Your First Request
            </Button>
          </a>
          <a href="#supply-chain">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/80 text-white hover:bg-white/10 bg-transparent font-bold px-10 py-7 text-xl rounded-full"
            >
              How It Works
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
