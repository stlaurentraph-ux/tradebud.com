"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  {
    label: "Solutions",
    children: [
      { label: "For Farmers", href: "/farmers", description: "Offline-first mapping & data ownership" },
      { label: "For Exporters", href: "/exporters", description: "Batch management & DDS automation" },
      { label: "For Importers", href: "/importers", description: "Full supply chain visibility" },
      { label: "For Countries", href: "/countries", description: "DPI-native infrastructure" },
    ],
  },
  { label: "Technology", href: "/#technology" },
  { label: "Compliance", href: "/#compliance" },
  { label: "Partners", href: "/#partners" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.children ? (
                  <button className={`flex items-center gap-1 transition-colors font-semibold text-lg ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--data-emerald)]" : "text-white/90 hover:text-[var(--data-emerald)]"}`}>
                    {link.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    href={link.href || "/"}
                    className={`transition-colors font-semibold text-lg ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--data-emerald)]" : "text-white/90 hover:text-[var(--data-emerald)]"}`}
                  >
                    {link.label}
                  </Link>
                )}

                {/* Dropdown */}
                <AnimatePresence>
                  {link.children && openDropdown === link.label && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block px-6 py-4 hover:bg-[var(--data-emerald)]/10 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="font-bold text-[var(--forest-canopy)]">{child.label}</div>
                          <div className="text-sm text-gray-600">{child.description}</div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Button
              variant="ghost"
              className={`font-semibold text-lg ${isScrolled ? "text-[var(--forest-canopy)] hover:text-[var(--forest-canopy)] hover:bg-[var(--forest-canopy)]/10" : "text-white hover:text-white hover:bg-white/10"}`}
            >
              Log In
            </Button>
            <a href="https://v0-offline-app-design-jcs49s2t1-stlaurentraph-4260s-projects.vercel.app" target="_blank" rel="noopener noreferrer">
              <Button className={`font-bold text-lg px-6 rounded-full ${isScrolled ? "bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white" : "bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)]"}`}>
                Try the App
              </Button>
            </a>
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
              <div>
                <p className="text-white/50 text-sm font-semibold mb-4 uppercase tracking-wider">Solutions</p>
                <div className="flex flex-col gap-4">
                  {navLinks[0].children?.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="text-2xl font-bold text-white hover:text-[var(--data-emerald)] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/20 pt-6">
                {navLinks.slice(1).map((link) => (
                  <Link
                    key={link.label}
                    href={link.href || "/"}
                    className="block text-2xl font-bold text-white hover:text-[var(--data-emerald)] transition-colors mb-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4 mt-8 pb-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/50 text-white hover:bg-white/10 w-full bg-transparent font-bold text-xl py-6 rounded-full"
                >
                  Log In
                </Button>
                <Link href="/farmers" className="w-full">
                  <Button
                    size="lg"
                    className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold w-full text-xl py-6 rounded-full"
                  >
                    Start Mapping
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
