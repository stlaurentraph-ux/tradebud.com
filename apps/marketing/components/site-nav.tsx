/**
 * SiteNav — Stage B nav shell
 *
 * WIRING STATUS: Style-complete, NOT yet mounted.
 * To activate: import and replace <Header /> in app/[locale]/layout.tsx.
 * All hrefs below use `/${locale}/...` patterns — adjust once routes are published
 * via lib/marketing-publication.ts.
 *
 * Target structure (from V0_HANDOFF.md):
 *   Solutions ▾   Platform ▾   Compliance ▾   Pricing   Insights   [Get started]
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, type Locale } from "@/i18n.config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "dropdown"; label: string; menu: DropdownMenu };

interface DropdownMenu {
  sections: DropdownSection[];
}

interface DropdownSection {
  heading?: string;
  items: { label: string; href: string; description?: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isHomePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = pathname.split("/").filter(Boolean)[0];
  return (
    segment !== undefined &&
    locales.includes(segment as Locale) &&
    pathname.split("/").filter(Boolean).length === 1
  );
}

// ---------------------------------------------------------------------------
// Dropdown panel
// ---------------------------------------------------------------------------

function DropdownPanel({ menu, onClose }: { menu: DropdownMenu; onClose: () => void }) {
  return (
    <motion.div
      className="absolute left-0 top-full z-50 mt-1 min-w-[480px] rounded-2xl border border-[var(--forest-canopy)]/10 bg-white p-5 shadow-xl"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className={`grid gap-6 ${menu.sections.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {menu.sections.map((section, i) => (
          <div key={i}>
            {section.heading && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--forest-canopy)]/50">
                {section.heading}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex flex-col rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--forest-canopy)]/5"
                    onClick={onClose}
                  >
                    <span className="text-sm font-semibold text-[var(--forest-canopy)] group-hover:text-[var(--data-emerald)]">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 text-xs leading-relaxed text-[var(--forest-canopy)]/50">
                        {item.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Desktop nav item (link or dropdown trigger)
// ---------------------------------------------------------------------------

function DesktopNavItem({
  item,
  isOpen,
  onToggle,
  onClose,
}: {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, onClose]);

  if (item.kind === "link") {
    return (
      <Link
        href={item.href}
        className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && <DropdownPanel menu={item.menu} onClose={onClose} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile accordion section
// ---------------------------------------------------------------------------

function MobileSection({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (item.kind === "link") {
    return (
      <Link
        href={item.href}
        className="block rounded-lg px-3 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 flex flex-col gap-0.5 pb-2 pl-4">
              {item.menu.sections.flatMap((s) => s.items).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SiteNav
// ---------------------------------------------------------------------------

export function SiteNav() {
  const t = useTranslations("siteNav");
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const waitlist = useWaitlistDialog();

  const p = (path: string) => `/${locale}${path}`;

  const navItems: NavItem[] = [
    {
      kind: "dropdown",
      label: t("solutions"),
      menu: {
        sections: [
          {
            heading: t("solutionsMenu.byRole"),
            items: [
              { label: t("solutionsMenu.farmers"), href: p("/farmers"), description: "Offline mapping & GeoID passports" },
              { label: t("solutionsMenu.cooperatives"), href: p("/cooperatives"), description: "Aggregate, verify & export with confidence" },
              { label: t("solutionsMenu.exporters"), href: p("/exporters"), description: "Batch traceability & compliance bundles" },
              { label: t("solutionsMenu.importers"), href: p("/importers"), description: "Due-diligence & supplier risk dashboard" },
              { label: t("solutionsMenu.sponsors"), href: p("/sponsors"), description: "Fund network expansion & earn carbon credits" },
              { label: t("solutionsMenu.countries"), href: p("/countries"), description: "National DPI & sovereignty-first data layer" },
            ],
          },
          {
            heading: t("solutionsMenu.byOutcome"),
            items: [
              { label: t("solutionsMenu.plotMapping"), href: p("/farmers") },
              { label: t("solutionsMenu.dueDiligence"), href: p("/compliance/due-diligence") },
              { label: t("solutionsMenu.batchTraceability"), href: p("/exporters") },
              { label: t("solutionsMenu.supplierOutreach"), href: p("/importers") },
            ],
          },
        ],
      },
    },
    {
      kind: "dropdown",
      label: t("platform"),
      menu: {
        sections: [
          {
            items: [
              { label: t("platformMenu.overview"), href: p("/platform"), description: "End-to-end traceability infrastructure" },
              { label: t("platformMenu.offlineMapping"), href: p("/platform/offline-mapping"), description: "Works without internet, syncs on reconnect" },
              { label: t("platformMenu.aiVerification"), href: p("/platform/ai-verification"), description: "Satellite AI cross-checks every polygon" },
              { label: t("platformMenu.network"), href: p("/platform/network"), description: "Data sovereignty & permissioned sharing" },
              { label: t("platformMenu.integrations"), href: p("/platform/integrations"), description: "TRACES NT, GS1, customs API & more" },
            ],
          },
        ],
      },
    },
    {
      kind: "dropdown",
      label: t("compliance"),
      menu: {
        sections: [
          {
            items: [
              { label: t("complianceMenu.hub"), href: p("/compliance"), description: "Compliance toolkit overview" },
              { label: t("complianceMenu.eudr"), href: p("/compliance/eudr"), description: "EUDR regulation guide & timelines" },
              { label: t("complianceMenu.dueDiligence"), href: p("/compliance/due-diligence"), description: "Step-by-step due diligence workflow" },
              { label: t("complianceMenu.guides"), href: p("/compliance/guides"), description: "Checklists, templates & best practices" },
              { label: t("complianceMenu.security"), href: p("/compliance/security"), description: "Audit trails, encryption & access control" },
            ],
          },
        ],
      },
    },
    { kind: "link", label: t("pricing"), href: p("/pricing") },
    { kind: "link", label: t("insights"), href: p("/insights") },
  ];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleDropdown = (label: string) =>
    setOpenDropdown((prev) => (prev === label ? null : label));

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
          <Link href={`/${locale}`} className="group flex items-center gap-2.5 flex-shrink-0" aria-label="Tracebud home">
            <div className="relative h-9 w-9 transition-transform duration-200 group-hover:scale-105">
              <Image src="/images/tracebud-logo.png" alt="" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Tracebud</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <DesktopNavItem
                key={item.label}
                item={item}
                isOpen={openDropdown === item.label}
                onToggle={() => toggleDropdown(item.label)}
                onClose={() => setOpenDropdown(null)}
              />
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={p("/pilot")}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t("pilot")}
            </Link>
            <Button
              onClick={() => waitlist.setOpen(true)}
              size="sm"
              className="rounded-full bg-[var(--data-emerald)] px-5 py-2 text-sm font-bold text-[var(--forest-canopy)] shadow-none hover:bg-emerald-400"
            >
              {t("getStarted")}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 lg:hidden"
            onClick={() => setIsMobileOpen((p) => !p)}
            aria-expanded={isMobileOpen}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile full-screen drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[var(--forest-canopy)] px-6 pb-10 pt-20 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <nav className="flex flex-col gap-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <MobileSection
                  key={item.label}
                  item={item}
                  onClose={() => setIsMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6">
              <Link
                href={p("/pilot")}
                className="mb-3 block rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileOpen(false)}
              >
                {t("pilot")}
              </Link>
              <Button
                size="lg"
                className="w-full rounded-full bg-[var(--data-emerald)] py-6 text-base font-bold text-[var(--forest-canopy)] hover:bg-emerald-400"
                onClick={() => {
                  setIsMobileOpen(false);
                  waitlist.setOpen(true);
                }}
              >
                {t("getStarted")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
