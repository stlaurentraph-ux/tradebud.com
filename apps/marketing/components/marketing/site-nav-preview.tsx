/**
 * SiteNavPreview — June 2026 IA mega-nav.
 *
 * PREVIEW/DRAFT ONLY. This is NOT the live production header (that remains
 * <SiteNav />). It is passed into <MarketingPageLayout nav={...} /> on the
 * /preview and /draft routes so stakeholders can review the new structure
 * without changing any published URLs or the live site.
 *
 * Structure (from V0_JUNE_2026_INSTRUCTIONS.md):
 *   Solutions ▾   Platform ▾   Who we serve ▾   Outcomes ▾   Resources ▾   Pricing   [Get started]
 *
 * Roadmap badges appear on every Solution except EUDR compliance (the MVP).
 */

'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RoadmapBadge } from '@/components/marketing/roadmap-badge';

type MenuItem = {
  label: string;
  href: string;
  description?: string;
  roadmap?: boolean;
};

type MenuSection = {
  heading?: string;
  items: MenuItem[];
};

type NavEntry =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'dropdown'; label: string; sections: MenuSection[] };

export function SiteNavPreview({ locale }: { locale: string }) {
  const t = useTranslations('siteNav.june2026');
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const p = (path: string) => `/${locale}${path}`;

  const navItems: NavEntry[] = [
    {
      kind: 'dropdown',
      label: t('solutions'),
      sections: [
        {
          heading: t('solutionsMenu.allSolutions'),
          items: [
            { label: t('solutionsMenu.eudrCompliance'), href: p('/draft/solutions/eudr-compliance'), description: t('solutionsMenu.eudrDescription') },
            { label: t('solutionsMenu.esgCarbon'), href: p('/draft/solutions/esg-carbon'), description: t('solutionsMenu.esgDescription'), roadmap: true },
            { label: t('solutionsMenu.regenAg'), href: p('/draft/solutions/regenerative-agriculture'), description: t('solutionsMenu.regenDescription'), roadmap: true },
            { label: t('solutionsMenu.childLabor'), href: p('/draft/solutions/child-labor-monitoring'), description: t('solutionsMenu.childDescription'), roadmap: true },
            { label: t('solutionsMenu.openChain'), href: p('/draft/solutions/open-chain'), description: t('solutionsMenu.openChainDescription'), roadmap: true },
            { label: t('solutionsMenu.directTrade'), href: p('/draft/solutions/direct-trade'), description: t('solutionsMenu.directTradeDescription'), roadmap: true },
          ],
        },
      ],
    },
    {
      kind: 'dropdown',
      label: t('platform'),
      sections: [
        {
          items: [
            { label: t('platformMenu.overview'), href: p('/draft/platform'), description: '' },
            { label: t('platformMenu.fieldApp'), href: p('/draft/platform/field-app'), description: t('platformMenu.fieldAppDescription') },
            { label: t('platformMenu.dashboard'), href: p('/draft/platform/dashboard'), description: t('platformMenu.dashboardDescription') },
          ],
        },
      ],
    },
    {
      kind: 'dropdown',
      label: t('whoWeServe'),
      sections: [
        {
          items: [
            { label: t('whoWeServeMenu.hub'), href: p('/draft/who-we-serve') },
            { label: t('whoWeServeMenu.producers'), href: p('/draft/who-we-serve/producers') },
            { label: t('whoWeServeMenu.exporters'), href: p('/draft/who-we-serve/exporters') },
            { label: t('whoWeServeMenu.brands'), href: p('/draft/who-we-serve/brands') },
            { label: t('whoWeServeMenu.sponsors'), href: p('/draft/who-we-serve/sponsors') },
            { label: t('whoWeServeMenu.governments'), href: p('/draft/who-we-serve/governments') },
          ],
        },
      ],
    },
    {
      kind: 'dropdown',
      label: t('outcomes'),
      sections: [
        {
          items: [
            { label: t('outcomesMenu.hub'), href: p('/draft/outcomes') },
            { label: t('outcomesMenu.supplyChains'), href: p('/draft/outcomes/resilient-supply-chains') },
            { label: t('outcomesMenu.livelihoods'), href: p('/draft/outcomes/farmer-livelihoods') },
            { label: t('outcomesMenu.climate'), href: p('/draft/outcomes/nature-positive-climate') },
          ],
        },
      ],
    },
    {
      kind: 'dropdown',
      label: t('resources'),
      sections: [
        {
          items: [
            { label: t('resourcesMenu.hub'), href: p('/draft/resources') },
            { label: t('resourcesMenu.insights'), href: p('/insights') },
            { label: t('resourcesMenu.dataSovereignty'), href: p('/draft/resources/data-sovereignty') },
            { label: t('resourcesMenu.standards'), href: p('/draft/resources/verification-standards') },
            { label: t('resourcesMenu.apiDocs'), href: p('/draft/resources/api-docs') },
          ],
        },
      ],
    },
    { kind: 'link', label: t('pricing'), href: p('/pricing') },
  ];

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleDropdown = (label: string) =>
    setOpenDropdown((prev) => (prev === label ? null : label));

  return (
    <>
      <header className="border-b border-white/10 bg-[var(--forest-canopy)] shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href={`/${locale}/preview`} className="group flex shrink-0 items-center gap-2.5" aria-label="Tracebud home">
            <div className="relative h-9 w-9 transition-transform duration-200 group-hover:scale-105">
              <Image src="/images/tracebud-logo.png" alt="" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Tracebud</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Preview navigation">
            {navItems.map((item) =>
              item.kind === 'link' ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <DesktopDropdown
                  key={item.label}
                  label={item.label}
                  sections={item.sections}
                  isOpen={openDropdown === item.label}
                  onToggle={() => toggleDropdown(item.label)}
                  onClose={() => setOpenDropdown(null)}
                />
              ),
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center lg:flex">
            <Link
              href={p('/get-started')}
              className="rounded-full bg-[var(--data-emerald)] px-5 py-2 text-sm font-bold text-[var(--forest-canopy)] transition-colors hover:bg-emerald-400"
            >
              {t('getStarted')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 lg:hidden"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-expanded={isMobileOpen}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[var(--forest-canopy)] px-6 pb-10 pt-20 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <nav className="flex flex-col gap-1" aria-label="Preview navigation">
              {navItems.map((item) =>
                item.kind === 'link' ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block rounded-lg px-3 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <MobileAccordion key={item.label} label={item.label} sections={item.sections} onClose={() => setIsMobileOpen(false)} />
                ),
              )}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6">
              <Link
                href={p('/get-started')}
                className="block w-full rounded-full bg-[var(--data-emerald)] py-4 text-center text-base font-bold text-[var(--forest-canopy)] hover:bg-emerald-400"
                onClick={() => setIsMobileOpen(false)}
              >
                {t('getStarted')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DesktopDropdown({
  label,
  sections,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  sections: MenuSection[];
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
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1 min-w-[420px] rounded-2xl border border-[var(--forest-canopy)]/10 bg-white p-5 shadow-xl"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {sections.map((section, i) => (
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
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--forest-canopy)] group-hover:text-[var(--data-emerald)]">
                            {item.label}
                          </span>
                          {item.roadmap && <RoadmapBadge />}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileAccordion({
  label,
  sections,
  onClose,
}: {
  label: string;
  sections: MenuSection[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = sections.flatMap((s) => s.items);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 flex flex-col gap-0.5 pb-2 pl-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={onClose}
                >
                  {item.label}
                  {item.roadmap && <RoadmapBadge />}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
