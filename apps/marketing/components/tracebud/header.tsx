"use client";

import { useEffect, useState } from "react";
<<<<<<< HEAD
import { useTranslations, useLocale } from "next-intl";
=======
import { useLocale, useTranslations } from "next-intl";
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, localeNames } from "@/i18n.config";
=======
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, type Locale } from "@/i18n.config";

function isHomePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment !== undefined && locales.includes(segment as Locale) && pathname.split("/").filter(Boolean).length === 1;
}
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893

export function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const homePath = `/${locale}`;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const waitlist = useWaitlistDialog();

  const navLinks = [
<<<<<<< HEAD
    { label: "How it works", href: "/#how-it-works" },
    { label: "Who it's for", href: "/#who-it-is-for" },
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
=======
    { label: t("nav.whyTracebud"), href: "#why-tracebud" },
    { label: t("nav.howItWorks"), href: "#how-it-works" },
    { label: t("nav.products"), href: "#products" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  const resolvedHref = (href: string) => {
    if (!href.startsWith("#")) return href;
    return isHomePath(pathname) ? href : `${homePath}${href}`;
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
  };

  const linkClass = isScrolled
    ? "text-foreground/80 hover:text-foreground"
    : "text-white/90 hover:text-white";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
<<<<<<< HEAD
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100" : "bg-transparent"
=======
          isScrolled
            ? "border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-md"
            : "bg-transparent"
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
<<<<<<< HEAD
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
=======
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href={homePath} className="group flex items-center gap-2.5">
            <div className="relative h-9 w-9 transition-transform group-hover:scale-105">
              <Image src="/images/tracebud-logo.png" alt="Tracebud" fill className="object-contain" />
            </div>
            <span className={`text-lg font-semibold tracking-tight transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
              Tracebud
            </span>
          </Link>

<<<<<<< HEAD
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
=======
          <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
            {navLinks.map((link) => (
              <Link key={link.href} href={resolvedHref(link.href)} className={`text-sm font-medium transition-colors ${linkClass}`}>
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
                {link.label}
              </Link>
            ))}
          </nav>

<<<<<<< HEAD
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
=======
          <div className="hidden items-center md:flex">
            <Button
              onClick={() => waitlist.setOpen(true)}
              size="sm"
              className={`rounded-full px-5 font-semibold ${
                isScrolled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white text-[var(--forest-canopy)] hover:bg-white/90"
              }`}
            >
              {t("cta.startTrial")}
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
            </Button>
          </div>

          <button
            type="button"
            className={`p-2 md:hidden ${isScrolled ? "text-foreground" : "text-white"}`}
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
<<<<<<< HEAD
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
=======
              className="fixed inset-0 z-40 bg-background px-6 pt-20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="flex flex-col gap-1" aria-label="Page sections">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={resolvedHref(link.href)}
                    className="rounded-lg px-2 py-3 text-lg font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Button
                size="lg"
                className="mt-8 w-full rounded-full font-semibold"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  waitlist.setOpen(true);
                }}
              >
                {t("cta.startTrial")}
              </Button>
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
