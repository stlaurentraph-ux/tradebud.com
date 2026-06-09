"use client";

import { Mail, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWaitlistDialog } from "@/components/waitlist-dialog";
import { locales, type Locale } from "@/i18n.config";

function isHomePath(pathname: string) {
  if (pathname === "/") return true;
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment !== undefined && locales.includes(segment as Locale) && pathname.split("/").filter(Boolean).length === 1;
}

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const pathname = usePathname();
  const homePath = `/${locale}`;
  const waitlist = useWaitlistDialog();

  const resolvedHref = (hash: string) => (isHomePath(pathname) ? hash : `${homePath}${hash}`);

  return (
    <>
      <section className="border-t border-[var(--forest-canopy)]/10 bg-[var(--forest-canopy)] px-6 py-14">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">{t("waitlistPrompt")}</h2>
          <p className="mb-6 max-w-xl text-white/70">{t("waitlistSubline")}</p>
          <Button
            onClick={() => waitlist.setOpen(true)}
            className="rounded-full bg-[var(--data-emerald)] px-8 py-6 text-base font-semibold text-[var(--forest-canopy)] hover:bg-emerald-400"
          >
            {t("joinWaitlist")}
          </Button>
        </div>
      </section>

      <footer className="bg-[var(--warm-stone)] px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <Link href={homePath} className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image src="/images/tracebud-logo.png" alt="Tracebud" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-[var(--forest-canopy)]">Tracebud</span>
            </Link>

            <div className="flex flex-wrap gap-8">
              <Link href={resolvedHref("#why-tracebud")} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("whyTracebud")}
              </Link>
              <Link href={resolvedHref("#how-it-works")} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("howItWorks")}
              </Link>
              <Link href={resolvedHref("#products")} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("products")}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("privacy")}
              </Link>
              <Link href={`/${locale}/terms`} className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("terms")}
              </Link>
              <a href="mailto:hello@tracebud.com" className="text-sm text-gray-600 hover:text-[var(--forest-canopy)]">
                {t("contact")}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="mailto:hello@tracebud.com"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-all hover:text-[var(--forest-canopy)] hover:shadow-md"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-all hover:text-[var(--forest-canopy)] hover:shadow-md"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/tracebud"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-all hover:text-[var(--forest-canopy)] hover:shadow-md"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Tracebud. {t("tagline")}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
