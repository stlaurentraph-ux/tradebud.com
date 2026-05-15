"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "mailto:hello@tracebud.com" },
];

export function Header() {
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
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-[var(--warm-stone)]"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 group-hover:scale-105 transition-transform">
              <Image
                src="/images/tracebud-logo.png"
                alt="Tracebud"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-[var(--forest-canopy)]">
              Tracebud
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-[var(--forest-canopy)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={() => waitlist.setOpen(true)}
              className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold px-6 py-2 rounded-full"
            >
              Join the waitlist
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[var(--forest-canopy)]"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100"
            >
              <div className="px-6 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-medium text-gray-600 hover:text-[var(--forest-canopy)] py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    waitlist.setOpen(true);
                  }}
                  className="w-full bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-semibold py-3 rounded-full mt-4"
                >
                  Join the waitlist
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
