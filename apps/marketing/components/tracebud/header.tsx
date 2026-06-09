"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, type Locale } from "@/i18n.config";

function isHomePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment !== undefined && locales.includes(segment as Locale) && pathname.split("/").filter(Boolean).length === 1;
}

export function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const pathname = usePathname();
  const homePath = `/${locale}`;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const waitlist = useWaitlistDialog();

  const navLinks = [
    { label: t("nav.products"), href: "#products" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.pilot"), href: "/pilot" },
  ];

  const resolvedHref = (href: string) => {
    if (href.startsWith("#")) {
      return isHomePath(pathname) ? href : `${homePath}${href}`;
    }
    if (href.startsWith("/") && !href.startsWith(`/${locale}`)) {
      return `/${locale}${href}`;
    }
    return href;
  };

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
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-[var(--forest-canopy)]/10 bg-[var(--forest-canopy)] shadow-md"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href={homePath} className="group flex items-center gap-2.5" aria-label="Tracebud home">
            <div className="relative h-9 w-9 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image src="/images/tracebud-logo.png" alt="" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Tracebud
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={resolvedHref(link.href)}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              onClick={() => waitlist.setOpen(true)}
              size="sm"
              className="rounded-full bg-[var(--data-emerald)] px-5 py-2 text-sm font-bold text-[var(--forest-canopy)] shadow-none transition-colors hover:bg-emerald-400"
            >
              {t("cta.startTrial")}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-40 flex flex-col bg-[var(--forest-canopy)] px-6 pb-10 pt-20 md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <nav className="flex flex-col gap-1" aria-label="Main navigation">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={resolvedHref(link.href)}
                    className="rounded-lg px-3 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-white/10 pt-6">
                <Button
                  size="lg"
                  className="w-full rounded-full bg-[var(--data-emerald)] py-6 text-base font-bold text-[var(--forest-canopy)] hover:bg-emerald-400"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    waitlist.setOpen(true);
                  }}
                >
                  {t("cta.startTrial")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
