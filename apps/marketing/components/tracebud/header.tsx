"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const personaLinks = [
  { label: "Farmers", href: "/farmers" },
  { label: "Exporters", href: "/exporters" },
  { label: "Importers", href: "/importers" },
  { label: "Countries", href: "/countries" },
];

const secondaryLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Platform", href: "/#platform-architecture" },
];

export function Header() {
  const pathname = usePathname();
  const isFarmersPage = pathname === "/farmers";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const resolvedHref = (href: string | undefined) => {
    if (!href) return "/";
    if (!href.includes("#")) return href;
    const [base, hash] = href.split("#");
    if (pathname === "/" && (base === "/" || base === "")) {
      return `#${hash}`;
    }
    return href;
  };

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
            ? "bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-100"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 group-hover:scale-105 transition-transform">
              <Image
                src="/images/tracebud-logo.png"
                alt="Tracebud"
                fill
                className="object-contain"
              />
            </div>
            <span className={`text-2xl font-bold transition-colors ${isScrolled ? "text-[var(--forest-canopy)]" : "text-white"}`}>Tracebud</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <span
              className={`font-semibold text-base ${isScrolled ? "text-[var(--forest-canopy)]/75" : "text-white/75"}`}
            >
              For:
            </span>
            {personaLinks.map((link) => (
              <Link
                key={link.label}
                href={resolvedHref(link.href)}
                className={`transition-colors font-semibold text-base ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--data-emerald)]" : "text-white/90 hover:text-[var(--data-emerald)]"}`}
              >
                {link.label}
              </Link>
            ))}
            <div className={`h-5 w-px ${isScrolled ? "bg-[var(--forest-canopy)]/20" : "bg-white/30"}`} />
            {secondaryLinks.map((link) => (
              <Link
                key={link.label}
                href={resolvedHref(link.href)}
                className={`transition-colors font-semibold text-base ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--data-emerald)]" : "text-white/90 hover:text-[var(--data-emerald)]"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {!isFarmersPage ? (
              <Button
                variant="ghost"
                className={`font-semibold text-lg ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--forest-canopy)] hover:bg-[var(--forest-canopy)]/10" : "text-white hover:text-white hover:bg-white/10"}`}
              >
                <span className="inline-flex items-baseline gap-1">
                  <span>Log In</span>
                  <span className="text-[10px] font-medium opacity-70">(coming soon)</span>
                </span>
              </Button>
            ) : null}
            {!isFarmersPage ? (
              <Link href="/get-started">
                <Button className={`font-bold text-lg px-6 rounded-full ${isScrolled ? "bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white" : "bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)]"}`}>
                  Get Started
                </Button>
              </Link>
            ) : (
              <Link href="/farmers#signup">
                <Button
                  variant="ghost"
                  className={`font-semibold text-sm lg:text-base rounded-full ${isScrolled ? "text-[var(--forest-canopy)] hover:bg-[var(--forest-canopy)]/10" : "text-white hover:bg-white/10"}`}
                >
                  Request access
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 ${isScrolled ? "text-[var(--forest-canopy)]" : "text-white"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
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
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-white/70 font-semibold text-sm">For:</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {personaLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={resolvedHref(link.href)}
                      className="text-base font-semibold text-white hover:text-[var(--data-emerald)] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="h-px bg-white/20 mb-5" />
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={resolvedHref(link.href)}
                    className="block text-base font-semibold text-white hover:text-[var(--data-emerald)] transition-colors mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4 mt-8 pb-8">
                {isFarmersPage ? (
                  <Link href="/farmers#signup" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-white/50 text-white hover:bg-white/10 w-full bg-transparent font-bold text-lg py-6 rounded-full"
                    >
                      Request access
                    </Button>
                  </Link>
                ) : null}
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/50 text-white hover:bg-white/10 w-full bg-transparent font-bold text-xl py-6 rounded-full"
                >
                  <span className="inline-flex items-baseline gap-1">
                    <span>Log In</span>
                    <span className="text-[10px] font-medium opacity-70">(coming soon)</span>
                  </span>
                </Button>
                {!isFarmersPage ? (
                  <Link href="/get-started" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      size="lg"
                      className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold w-full text-xl py-6 rounded-full"
                    >
                      Get Started
                    </Button>
                  </Link>
                ) : null}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
