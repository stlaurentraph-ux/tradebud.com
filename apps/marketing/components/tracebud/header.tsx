"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, localeNames } from "@/i18n.config";

export function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const waitlist = useWaitlistDialog();

  const navLinks = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Pilot", href: "/pilot" },
  ];

  const switchLocale = (targetLocale: string) => {
    // Remove current locale from pathname if present
    let pathWithoutLocale = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.slice(`/${locale}`.length) || "/";
    }
    // Add target locale to the path
    const newPath = `/${targetLocale}${pathWithoutLocale}`;
    // Use window.location for full page reload to trigger next-intl locale change
    window.location.href = newPath;
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

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`font-semibold transition-colors ${
                  isScrolled
                    ? "text-[var(--forest-canopy)] hover:text-[var(--data-emerald)]"
                    : "text-white/90 hover:text-[var(--data-emerald)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isScrolled
                    ? "text-[var(--forest-canopy)] hover:bg-gray-100"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="font-semibold text-sm">{locale.toUpperCase()}</span>
              </button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={`block w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${
                          locale === loc
                            ? "bg-[var(--forest-canopy)]/10 text-[var(--forest-canopy)]"
                            : "text-[var(--forest-canopy)] hover:bg-gray-100"
                        }`}
                      >
                        {localeNames[loc as keyof typeof localeNames]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-base font-semibold text-white hover:text-[var(--data-emerald)] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-white/20 pt-4">
                  <p className="text-sm font-semibold text-white/70 mb-3">Language</p>
                  <div className="grid grid-cols-2 gap-2">
                    {locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          switchLocale(loc);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded text-left text-sm font-semibold transition-colors ${
                          locale === loc
                            ? "bg-[var(--data-emerald)] text-[var(--forest-canopy)]"
                            : "text-white hover:bg-white/10"
                        }`}
                      >
                        {localeNames[loc as keyof typeof localeNames]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-8 pb-8">
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
