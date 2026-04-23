"use client";

import { motion } from "framer-motion";
import { Mail, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const platformLinks = [
  { label: "Pilot program", href: "/pilot" },
  { label: "For Farmers", href: "/farmers" },
  { label: "For Exporters", href: "/exporters" },
  { label: "For Importers", href: "/importers" },
  { label: "For Countries", href: "/countries" },
];

const resourceLinks = [
  { label: "Documentation", href: "#" },
  { label: "API Reference", href: "#" },
  { label: "EUDR Guide", href: "#" },
  { label: "Case Studies", href: "#" },
];

const companyLinks = [
  { label: "About Us", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Data Processing", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative bg-[var(--forest-canopy)] text-white py-12 md:py-24 px-4 md:px-6 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="https://images.unsplash.com/photo-1501353163335-102e39d92607?q=80&w=2070&auto=format&fit=crop"
          alt="Coffee plantation background"
          fill
          className="object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12 mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="relative w-10 h-10 md:w-14 md:h-14">
                <Image
                  src="/images/tracebud-logo.png"
                  alt="Tracebud"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl md:text-3xl font-bold">Tracebud</span>
            </Link>
            <p className="text-white/80 text-base md:text-lg mb-6 md:mb-8 max-w-md leading-relaxed">
              The fastest, safest, cheapest way to move smallholder production into EUDR & ESG markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/farmers">
                <Button
                  size="default"
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold text-sm md:text-base px-5 md:px-8 rounded-full w-full sm:w-auto"
                >
                  Start Mapping
                </Button>
              </Link>
              <Button
                size="default"
                variant="outline"
                className="border-2 border-white/50 text-white hover:bg-white/10 bg-transparent font-bold text-sm md:text-base px-5 md:px-8 rounded-full"
              >
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-sm md:text-lg mb-4 md:mb-6 text-white">Platform</h4>
            <ul className="space-y-2 md:space-y-4">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-[var(--data-emerald)] transition-colors text-sm md:text-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm md:text-lg mb-4 md:mb-6 text-white">Resources</h4>
            <ul className="space-y-2 md:space-y-4">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-[var(--data-emerald)] transition-colors text-sm md:text-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-sm md:text-lg mb-4 md:mb-6 text-white">Company</h4>
            <ul className="space-y-2 md:space-y-4">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-[var(--data-emerald)] transition-colors text-sm md:text-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-white/20 pt-8 md:pt-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm md:text-base text-center md:text-left">
              {new Date().getFullYear()} Tracebud. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-white/60 hover:text-white transition-colors text-sm md:text-base"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end gap-3">
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </a>
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </a>
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
