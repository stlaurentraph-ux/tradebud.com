"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Header() {
  const t = useTranslations("header");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const waitlist = useWaitlistDialog();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 group-hover:scale-105 transition-transform">
              <Image src="/images/tracebud-logo.png" alt="Tracebud" fill className="object-contain" />
            </div>
            <span
              className={`text-xl font-bold transition-colors ${
                isScrolled ? "text-[var(--forest-canopy)]" : "text-white"
              }`}
            >
              Tracebud
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-4">
            <Button
              onClick={() => waitlist.setOpen(true)}
              className={`font-bold px-6 rounded-full ${
                isScrolled ? "bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white" : "bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)]"
              }`}
            >
              Get started
            </Button>
          </div>

          <button
            className={`lg:hidden p-2 ${isScrolled ? "text-[var(--forest-canopy)]" : "text-white"}`}
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-[var(--forest-canopy)] pt-24 px-6 overflow-y-auto"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 pb-8">
                  <Button
                    size="lg"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      waitlist.setOpen(true);
                    }}
                    className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold w-full text-lg py-6 rounded-full"
                  >
                    Get started
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
