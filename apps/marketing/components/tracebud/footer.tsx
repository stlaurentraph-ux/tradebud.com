"use client";

import { motion } from "framer-motion";
import { Mail, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Footer() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Footer */}
      <footer className="bg-[var(--warm-stone)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/tracebud-logo.png"
                  alt="Tracebud"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-[var(--forest-canopy)]">Tracebud</span>
            </Link>

            {/* Links */}
            <div className="flex flex-wrap gap-8">
              <Link href="#how-it-works" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                How It Works
              </Link>
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                Terms
              </Link>
              <a href="mailto:hello@tracebud.com" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                Contact
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4">
              <a
                href="mailto:hello@tracebud.com"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-[var(--forest-canopy)] hover:shadow-md transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Tracebud. Simpler EUDR operations. Stronger market access.
            </p>
          </div>
        </div>
      </footer>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
