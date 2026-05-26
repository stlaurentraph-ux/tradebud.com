"use client";

import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Hero() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Farmer in coffee field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
                Traceability that works for everyone in the chain.
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                Tracebud makes EUDR compliance simple, self-serve, and affordable — so farmers, cooperatives, exporters, and buyers can collect, share, and reuse origin data without chasing paperwork.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-base rounded-full"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold px-8 py-6 text-base rounded-full"
                >
                  Talk to us
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-white/60">
                Free for producers. Built for low-connectivity, low-friction field realities. No consultants required.
              </p>
            </motion.div>

            {/* Right: App Screenshot - clean, no background */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-[280px] md:w-[320px]">
                <Image
                  src="/images/farmer-app-homepage.png"
                  alt="Tracebud Farmer App interface"
                  width={320}
                  height={693}
                  className="w-full h-auto"
                />

                {/* Floating badges */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">Works Offline</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="text-2xl font-bold text-[var(--forest-canopy)]">20 min</div>
                  <div className="text-xs text-gray-500">to map a farm</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Tracebud Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
                Compliance should not be complicated to be credible.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Most supply chains do not fail because people do not care. They fail because the process is too manual, too expensive, and too fragmented. Tracebud removes the back-and-forth so every actor can participate, even when the network is large, spread out, or under-resourced.
              </p>
            </motion.div>

            {/* Right: Three Pillars */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {[
                {
                  icon: Layers,
                  title: "Simple",
                  description: "One platform. One workflow. One source of truth.",
                },
                {
                  icon: Zap,
                  title: "Automated",
                  description: "Requests move through the network automatically, so proof reaches the source faster.",
                },
                {
                  icon: Users,
                  title: "Inclusive",
                  description: "Farmers can participate directly, even with limited digital access, shared devices, or spotty signal.",
                },
              ].map((pillar, index) => (
                <div 
                  key={pillar.title}
                  className="flex gap-5 p-6 bg-[var(--warm-stone)] rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center flex-shrink-0">
                    <pillar.icon className="w-6 h-6 text-[var(--data-emerald)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--forest-canopy)] mb-1">{pillar.title}</h3>
                    <p className="text-gray-600">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-[var(--warm-stone)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
              From first request to reusable proof.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                number: "1",
                title: "Add your network",
                description: "One contact or five hundred. Upload a CSV or add them manually.",
              },
              {
                number: "2", 
                title: "Send one request",
                description: "Let it flow through the chain automatically. No chasing.",
              },
              {
                number: "3",
                title: "Collect origin data",
                description: "Capture it once, then reuse it across shipments and buyers.",
              },
              {
                number: "4",
                title: "Stay aligned",
                description: "Keep everyone on the same page with a shared, digital workflow.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-5xl font-bold text-[var(--data-emerald)] mb-4">{item.number}</div>
                <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
