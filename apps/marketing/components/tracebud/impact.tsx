"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Quote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCreateAccountUrl } from "@/lib/dashboard";

const testimonials = [
  {
    quote: "The offline mapping works perfectly under our coffee canopy. We mapped 3,000 farms in just two weeks.",
    author: "Rosa María Hernández",
    role: "Cooperative Manager, Honduras",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
  },
  {
    quote: "The yield cap validation caught fraudulent batches we would have missed. Our compliance rate hit 98%.",
    author: "Jean-Claude Mbeki",
    role: "Export Director, Ivory Coast",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
  },
  {
    quote: "Direct TRACES NT integration eliminated manual data entry. We cut compliance processing time by 80%.",
    author: "Sophie Mueller",
    role: "Sustainability Lead, Germany",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
  },
];

const stats = [
  { value: "50,000+", label: "Farms Mapped" },
  { value: "12", label: "Countries" },
  { value: "98%", label: "Compliance Rate" },
  { value: "80%", label: "Time Saved" },
];

export function Impact() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background with coffee farmers */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1611174275859-9c5a15c2e2b6?q=80&w=2070&auto=format&fit=crop"
          alt="Coffee farmers harvesting"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[var(--forest-canopy)]/90" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Trusted Worldwide
          </h2>
          <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            From smallholder farmers to EU importers, hear how Tracebud transforms supply chain compliance.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Quote className="w-8 h-8 md:w-10 md:h-10 text-[var(--data-emerald)] mb-4 md:mb-6" />
              <p className="text-white text-base md:text-xl leading-relaxed mb-6 md:mb-8">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-white text-base md:text-lg">{testimonial.author}</div>
                  <div className="text-white/70 text-sm md:text-base">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--data-emerald)] mb-1 md:mb-2">
                {stat.value}
              </div>
              <div className="text-white/80 text-sm md:text-lg font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="flex flex-col gap-6 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row gap-3 md:gap-5 justify-center items-center">
            <Link href={getCreateAccountUrl()}>
              <Button
                size="lg"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl gap-2 md:gap-3 rounded-full shadow-xl w-full sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 hover:border-white px-6 md:px-10 py-5 md:py-7 text-base md:text-xl gap-2 md:gap-3 bg-transparent rounded-full w-full sm:w-auto"
              >
                Book 15-min Demo
              </Button>
            </Link>
          </div>
          <p className="text-white/70 text-sm">
            30 days free. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
