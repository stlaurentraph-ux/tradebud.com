"use client";

import { motion } from "framer-motion";
import { ArrowRight, WifiOff, MapPin, Camera, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Hero() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/feature-offline-mapping.jpg"
            alt="Farmer using Tracebud in coffee field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 md:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Deadline Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-white/90 text-sm font-medium">
                  EU requires proof of origin by December 2026
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
                Your farm. Your proof.
                <span className="block text-[var(--data-emerald)]">Works everywhere.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                Map your plot once. That proof works for every EU buyer, forever. Free for farmers. Works offline in the field.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-8 py-6 text-base rounded-full shadow-lg"
                >
                  Join the waitlist
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-base rounded-full backdrop-blur-sm"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>EUDR compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--data-emerald)]">Free</span>
                  <span>for farmers</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Phone Mockup with Real Screenshot */}
            <motion.div
              className="relative hidden lg:flex justify-center"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Phone Frame */}
              <div className="relative">
                <div className="bg-slate-900 rounded-[3rem] p-2 shadow-2xl">
                  <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden relative">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
                    {/* Screenshot */}
                    <div className="w-[280px] h-[580px] relative">
                      <Image
                        src="/images/farmer-app-homepage.png"
                        alt="Tracebud Farmer App"
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  className="absolute -left-16 top-24 bg-white rounded-xl shadow-xl p-4 border border-gray-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Plot mapped</div>
                      <div className="text-xs text-gray-500">2.3 hectares verified</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -right-12 top-48 bg-white rounded-xl shadow-xl p-4 border border-gray-100"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <WifiOff className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Offline mode</div>
                      <div className="text-xs text-gray-500">No signal needed</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -left-8 bottom-32 bg-white rounded-xl shadow-xl p-4 border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">4 photos</div>
                      <div className="text-xs text-gray-500">GPS-tagged evidence</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-4">
              The Problem
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance">
              When your buyer asks &ldquo;where did this come from?&rdquo; you scramble.
            </h2>
            <div className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto space-y-4">
              <p>Your farmer has records. They&apos;re scattered.</p>
              <p>Your cooperative has notes. They&apos;re in a spreadsheet.</p>
              <p>Your exporter has documents. They&apos;re disconnected from everything.</p>
              <p className="font-semibold text-[var(--forest-canopy)]">
                Your buyer needs one clear answer. They get a folder of contradictions.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 md:py-32 bg-[var(--warm-stone)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[var(--data-emerald)] font-semibold text-sm uppercase tracking-wider mb-4">
              The Solution
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-6">
              Map once. Prove forever.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Farmers map their plot once. That proof works for any EU buyer, forever. No re-doing work. No asking twice.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Farmers map once",
                description: "One walk around the field. Takes 20 minutes. Works offline. Then it's done.",
                image: "/images/step-map-plot.jpg",
              },
              {
                number: "2", 
                title: "Proof rolls up",
                description: "Cooperatives see all members. Exporters get buyer-ready packages. No spreadsheets.",
                image: "/images/feature-digital-receipts.jpg",
              },
              {
                number: "3",
                title: "Ship with confidence",
                description: "Customs sees proof. They approve. You move product. Sleep at night.",
                image: "/images/step-certified.jpg",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[var(--data-emerald)] flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{item.number}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--forest-canopy)] mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
