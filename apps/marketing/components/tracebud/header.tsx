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
  const tSiteNav = useTranslations("siteNav");
  const locale = useLocale();
  const pathname = usePathname();
  const homePath = `/${locale}`;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const waitlist = useWaitlistDialog();

  const navLinks = [
    { label: t("nav.products"), href: "#products" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: tSiteNav("insights"), href: "/insights" },
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
          isScrolled
            ? "border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-md"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href={homePath} className="group flex items-center gap-2.5">
            <div className="relative h-9 w-9 transition-transform group-hover:scale-105">
              <Image src="/images/tracebud-logo.png" alt="Tracebud" fill className="object-contain" />
            </div>
            <span className={`text-lg font-semibold tracking-tight transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
              Tracebud
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
            {navLinks.map((link) => (
              <Link key={link.href} href={resolvedHref(link.href)} className={`text-sm font-medium transition-colors ${linkClass}`}>
                {link.label}
              </Link>
            ))}
          </nav>

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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
